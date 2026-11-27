import { assertKoaCondition } from '@appsemble/node-utils';
import { type AppOAuth2SecretRequestFailure, OrganizationPermission } from '@appsemble/types';
import axios from 'axios';
import { type Context } from 'koa';

import { checkUserOrganizationPermissions } from './authorization.js';
import { assertSlidingWindowRateLimit } from './ratelimit/assertSlidingWindowRateLimit.js';
import { App, type AppOAuth2Secret, getAppDB } from '../models/index.js';

/**
 * How many milliseconds a test waits for each response of the provider.
 */
export const appOAuth2SecretTestTimeout = 10_000;

export type AppOAuth2SecretTestValues = Pick<
  AppOAuth2Secret,
  | 'authorizationUrl'
  | 'clientId'
  | 'clientSecret'
  | 'remapper'
  | 'roleMappings'
  | 'scope'
  | 'tokenUrl'
  | 'userInfoUrl'
>;

/**
 * Get the OAuth2 login settings a Studio user tests.
 *
 * A body with only an ID tests the stored secret. Otherwise the body holds the settings, as when
 * updating a secret, and an omitted client secret is taken from the stored secret with the ID if
 * the token URL is the stored one.
 *
 * Only organization members who may update the app secrets may test them. Each test makes requests
 * to URLs the user chooses, so tests are rate limited per user.
 *
 * @param ctx The Koa context of the test request.
 * @returns The settings to test.
 */
export async function getAppOAuth2SecretTestValues(
  ctx: Context,
): Promise<AppOAuth2SecretTestValues> {
  const {
    pathParams: { appId },
    request: {
      body: { code, id, ...settings },
    },
  } = ctx;
  const app = await App.findByPk(appId, { attributes: ['OrganizationId'] });
  assertKoaCondition(app != null, ctx, 404, 'App not found');

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId: app.OrganizationId,
    requiredPermissions: [OrganizationPermission.UpdateAppSecrets],
  });
  await assertSlidingWindowRateLimit(ctx, 'testAppOAuth2Secret', 30, 10 * 60 * 1000, {
    identifierFunction: () => ctx.user!.id,
  });

  let stored: AppOAuth2SecretTestValues | null = null;
  if (id != null) {
    const { AppOAuth2Secret } = await getAppDB(appId);
    stored = await AppOAuth2Secret.findByPk(id);
    assertKoaCondition(stored != null, ctx, 404, 'OAuth2 secret not found');
  }

  // A caller must not be able to send the stored client secret to a token URL of their choosing.
  const values: Partial<AppOAuth2SecretTestValues> | null = Object.keys(settings).length
    ? {
        ...settings,
        clientSecret:
          settings.clientSecret ||
          (settings.tokenUrl === stored?.tokenUrl ? stored?.clientSecret : undefined),
      }
    : stored;
  assertKoaCondition(
    Boolean(values?.authorizationUrl && values.tokenUrl && values.clientId && values.clientSecret),
    ctx,
    400,
    'An authorization URL, token URL, client ID and client secret are required',
  );

  return values as AppOAuth2SecretTestValues;
}

/**
 * Describe an HTTP response of a provider.
 *
 * Only the status and the OAuth2 error fields (RFC 6749 section 5.2) are described, so the
 * response body of a URL a user chooses does not leak.
 *
 * @param status The HTTP status of the response.
 * @param data The response body.
 * @returns The status and the OAuth2 error of the response.
 */
export function describeProviderResponse(status: number, data: unknown): string {
  const { error, error_description: description } = (data ?? {}) as Record<string, unknown>;
  return [`HTTP ${status}`, error, description]
    .filter((part) => typeof part === 'string')
    .join(': ');
}

/**
 * Describe why a request to a provider failed.
 *
 * @param error The error the request threw.
 * @returns The kind of failure and what the server observed.
 */
export function describeRequestFailure(error: unknown): {
  reason: AppOAuth2SecretRequestFailure;
  detail: string;
} {
  if (axios.isAxiosError(error) && error.response) {
    return {
      reason: 'httpError',
      detail: describeProviderResponse(error.response.status, error.response.data),
    };
  }
  const { code, message } = error as NodeJS.ErrnoException;
  const detail = code ? `${code}: ${message}` : message;
  if (code === 'ECONNABORTED' || code === 'ETIMEDOUT') {
    return { reason: 'timeout', detail };
  }
  // This is how request-filtering-agent rejects a connection to a private or reserved address.
  if (/ is not allowed\. Because/.test(message)) {
    return { reason: 'blocked', detail };
  }
  if (code && /CERT|SSL|TLS|UNABLE_TO_(GET|VERIFY)/.test(code)) {
    return { reason: 'certificate', detail };
  }
  return { reason: 'unreachable', detail };
}
