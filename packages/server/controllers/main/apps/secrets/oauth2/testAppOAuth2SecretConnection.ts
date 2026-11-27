import { getSSRFProtectedAgents } from '@appsemble/node-utils';
import { type AppOAuth2SecretCheck } from '@appsemble/types';
import axios from 'axios';
import { type Context } from 'koa';

import {
  appOAuth2SecretTestTimeout,
  type AppOAuth2SecretTestValues,
  describeProviderResponse,
  describeRequestFailure,
  getAppOAuth2SecretTestValues,
} from '../../../../../utils/appOAuth2SecretTest.js';
import { argv } from '../../../../../utils/argv.js';
import { hasLoginRoleMappings } from '../../../../../utils/loginRoleMappings.js';
import { getAccessToken } from '../../../../../utils/oauth2.js';

/**
 * Authorization URL path endings of known providers, and how to derive the issuer from them.
 */
const issuerPaths: [RegExp, string][] = [
  // Keycloak
  [/\/protocol\/openid-connect\/auth$/, ''],
  // Microsoft Entra ID
  [/\/oauth2\/v2\.0\/authorize$/, '/v2.0'],
  // Google
  [/\/o\/oauth2\/v2\/auth$/, ''],
  // Providers which authorize relative to the issuer, such as Auth0 and GitLab
  [/(\/oauth2?)?\/authorize$/, ''],
];

function isHttpError(status: number): boolean {
  return status === 404 || status >= 500;
}

function normalizeUrl(url: string): string {
  if (!URL.canParse(url)) {
    return url;
  }
  const { origin, pathname } = new URL(url);
  return `${origin}${pathname.replace(/\/$/, '')}`;
}

async function checkEndpoint(
  check: AppOAuth2SecretCheck['check'],
  url: string,
  failStatus: AppOAuth2SecretCheck['status'],
): Promise<AppOAuth2SecretCheck> {
  try {
    const { data, status } = await axios.get(url, {
      maxRedirects: 0,
      responseType: 'stream',
      timeout: appOAuth2SecretTestTimeout,
      validateStatus: () => true,
      ...(await getSSRFProtectedAgents({ hostname: new URL(url).hostname })),
    });
    data.destroy();
    return isHttpError(status)
      ? { check, status: failStatus, reason: 'httpError', detail: `HTTP ${status}` }
      : { check, status: 'pass', reason: 'reachable', detail: `HTTP ${status}` };
  } catch (error) {
    return { check, status: failStatus, ...describeRequestFailure(error) };
  }
}

/**
 * Request a token for a made up authorization code, the way a login requests one.
 *
 * Per RFC 6749 section 5.2, a provider answers `invalid_client` if it can’t authenticate the
 * client, and `invalid_grant` if it rejects the code of an authenticated client.
 *
 * @param values The settings to test.
 * @returns The checks of the token URL and the client credentials.
 */
async function checkToken({
  clientId,
  clientSecret,
  tokenUrl,
}: AppOAuth2SecretTestValues): Promise<AppOAuth2SecretCheck[]> {
  try {
    await getAccessToken(
      tokenUrl,
      'appsemble-connection-test',
      String(new URL('/callback', argv.host)),
      clientId,
      clientSecret,
      appOAuth2SecretTestTimeout,
    );
    return [
      { check: 'tokenUrl', status: 'pass', reason: 'reachable', detail: 'HTTP 200' },
      { check: 'clientCredentials', status: 'warn', reason: 'unexpected', detail: 'HTTP 200' },
    ];
  } catch (error) {
    if (!axios.isAxiosError(error) || !error.response) {
      return [
        { check: 'tokenUrl', status: 'fail', ...describeRequestFailure(error) },
        { check: 'clientCredentials', status: 'skip', reason: 'tokenUrlFailed' },
      ];
    }
    const { data, status } = error.response;
    const detail = describeProviderResponse(status, data);
    if (isHttpError(status)) {
      return [
        { check: 'tokenUrl', status: 'fail', reason: 'httpError', detail },
        { check: 'clientCredentials', status: 'skip', reason: 'tokenUrlFailed' },
      ];
    }
    return [
      { check: 'tokenUrl', status: 'pass', reason: 'reachable', detail: `HTTP ${status}` },
      data?.error === 'invalid_grant'
        ? { check: 'clientCredentials', status: 'pass', reason: 'accepted', detail }
        : data?.error === 'invalid_client' || status === 401
          ? { check: 'clientCredentials', status: 'fail', reason: 'rejected', detail }
          : { check: 'clientCredentials', status: 'warn', reason: 'unexpected', detail },
    ];
  }
}

/**
 * Compare the settings with the OpenID Connect discovery document of the issuer.
 *
 * @param values The settings to test.
 * @returns The check of the discovery document.
 */
async function checkDiscovery(values: AppOAuth2SecretTestValues): Promise<AppOAuth2SecretCheck> {
  const authorizationUrl = new URL(values.authorizationUrl);
  const issuerPath = issuerPaths.find(([pattern]) => pattern.test(authorizationUrl.pathname));
  if (!issuerPath) {
    return { check: 'discovery', status: 'skip', reason: 'notDerivable' };
  }
  const discoveryUrl = String(
    new URL(
      `${authorizationUrl.pathname.replace(issuerPath[0], issuerPath[1])}/.well-known/openid-configuration`,
      authorizationUrl,
    ),
  );
  let data: Record<string, unknown>;
  try {
    ({ data } = await axios.get(discoveryUrl, {
      maxContentLength: 1 << 20,
      timeout: appOAuth2SecretTestTimeout,
      ...(await getSSRFProtectedAgents({ hostname: authorizationUrl.hostname })),
    }));
  } catch (error) {
    return axios.isAxiosError(error) && error.response?.status === 404
      ? { check: 'discovery', status: 'skip', reason: 'notFound', detail: discoveryUrl }
      : { check: 'discovery', status: 'warn', ...describeRequestFailure(error) };
  }
  if (typeof data?.token_endpoint !== 'string') {
    return { check: 'discovery', status: 'skip', reason: 'notFound', detail: discoveryUrl };
  }
  const mismatches = (
    [
      ['authorizationUrl', data.authorization_endpoint],
      ['tokenUrl', data.token_endpoint],
      ['userInfoUrl', data.userinfo_endpoint],
    ] as const
  )
    .filter(
      ([key, discovered]) =>
        values[key] &&
        typeof discovered === 'string' &&
        normalizeUrl(values[key]) !== normalizeUrl(discovered),
    )
    .map(([key, discovered]) => `${key}: ${discovered}`);
  return mismatches.length
    ? { check: 'discovery', status: 'warn', reason: 'mismatch', detail: mismatches.join('\n') }
    : { check: 'discovery', status: 'pass', reason: 'match', detail: discoveryUrl };
}

function checkScope({ roleMappings, scope }: AppOAuth2SecretTestValues): AppOAuth2SecretCheck {
  if (!hasLoginRoleMappings(roleMappings)) {
    return { check: 'scope', status: 'skip', reason: 'noRoleMappings' };
  }
  return scope?.split(' ').includes('groups')
    ? { check: 'scope', status: 'pass', reason: 'groupsScopeIncluded' }
    : { check: 'scope', status: 'warn', reason: 'groupsScopeMissing' };
}

export async function testAppOAuth2SecretConnection(ctx: Context): Promise<void> {
  const values = await getAppOAuth2SecretTestValues(ctx);

  const [authorizationUrl, [tokenUrl, clientCredentials], userInfoUrl, discovery] =
    await Promise.all([
      // Browsers open the authorization URL, so the server failing to reach it is only a hint.
      checkEndpoint('authorizationUrl', values.authorizationUrl, 'warn'),
      checkToken(values),
      values.userInfoUrl
        ? checkEndpoint('userInfoUrl', values.userInfoUrl, 'fail')
        : ({ check: 'userInfoUrl', status: 'skip', reason: 'notConfigured' } as const),
      checkDiscovery(values),
    ]);

  ctx.body = [
    authorizationUrl,
    tokenUrl,
    clientCredentials,
    userInfoUrl,
    discovery,
    checkScope(values),
  ] satisfies AppOAuth2SecretCheck[];
}
