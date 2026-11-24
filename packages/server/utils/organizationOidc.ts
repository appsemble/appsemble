import { getSSRFProtectedAgents } from '@appsemble/node-utils';
import axios from 'axios';
import { type Context } from 'koa';
import {
  allowInsecureRequests,
  buildAuthorizationUrl,
  calculatePKCECodeChallenge,
  type Configuration,
  customFetch,
  discovery,
  enableNonRepudiationChecks,
  randomNonce,
  randomPKCECodeVerifier,
  randomState,
} from 'openid-client';

import { type OrganizationSso } from '../models/main/OrganizationSso.js';
import { argv } from './argv.js';
import { decrypt, encrypt } from './crypto.js';

export const organizationSsoFlowCookie = 'organization-oidc';

/**
 * An authorization at an organization's provider which the Studio callback completes.
 */
export interface OrganizationSsoFlow {
  organizationId: string;
  configurationUpdated: number;
  state: string;
  nonce: string;
  codeVerifier: string;
  expires: number;
  email?: string;
  linkUserId?: string;
  candidateId?: string;

  /**
   * Personal client credentials which the provider's offline grant backs.
   */
  credentials?: { userId: string; description: string; expires?: string; scopes: string };
}

const configurations = new Map<
  string,
  { configurationUpdated: number; configuration: Promise<Configuration> }
>();

/**
 * Check whether an organization may sign in through its provider.
 *
 * Deployment-managed providers are authored by the installation operator. Studio-managed providers
 * must use an issuer which the operator allows.
 *
 * @param sso The organization's provider configuration.
 * @returns Whether the provider may be used.
 */
export function isOrganizationSsoIssuerAllowed(
  sso: Pick<OrganizationSso, 'issuer' | 'managedBy'>,
): boolean {
  return (
    sso.managedBy === 'deployment' ||
    Boolean(argv.organizationSsoIssuers?.split(',').includes(sso.issuer))
  );
}

function discover(sso: OrganizationSso): Promise<Configuration> {
  const issuer = new URL(sso.issuer);
  const localDevelopmentIssuer =
    process.env.NODE_ENV !== 'production' &&
    issuer.protocol === 'http:' &&
    ['localhost', '127.0.0.1', '[::1]'].includes(issuer.hostname);
  return discovery(issuer, sso.clientId, decrypt(sso.clientSecret, argv.aesSecret), undefined, {
    async [customFetch](url, options) {
      const response = await axios.request({
        url,
        method: options.method,
        headers: options.headers,
        data: options.body instanceof URLSearchParams ? String(options.body) : options.body,
        signal: options.signal,
        responseType: 'arraybuffer',
        maxRedirects: 0,
        validateStatus: () => true,
        ...(await getSSRFProtectedAgents({ hostname: new URL(url).hostname })),
      });
      return new Response(response.data, {
        status: response.status,
        headers: response.headers as Record<string, string>,
      });
    },
    execute: [
      enableNonRepudiationChecks,
      ...(localDevelopmentIssuer ? [allowInsecureRequests] : []),
    ],
  });
}

/**
 * Discover an organization's provider using the shared outbound request policy.
 *
 * A saved configuration reuses its successful discovery until its provider settings change.
 *
 * @param sso The organization's provider configuration.
 * @returns The discovered OpenID Connect client configuration.
 */
export function getOrganizationOidcConfiguration(sso: OrganizationSso): Promise<Configuration> {
  if (!isOrganizationSsoIssuerAllowed(sso)) {
    return Promise.reject(
      new Error(`The installation does not allow the single sign-on issuer ${sso.issuer}`),
    );
  }
  if (sso.isNewRecord) {
    return discover(sso);
  }
  const configurationUpdated = sso.configurationUpdated.getTime();
  const cached = configurations.get(sso.OrganizationId);
  if (cached?.configurationUpdated === configurationUpdated) {
    return cached.configuration;
  }
  const configuration = discover(sso);
  configurations.set(sso.OrganizationId, { configurationUpdated, configuration });
  configuration.catch(() => {
    if (configurations.get(sso.OrganizationId)?.configuration === configuration) {
      configurations.delete(sso.OrganizationId);
    }
  });
  return configuration;
}

/**
 * Start an authorization at an organization's provider.
 *
 * The flow is kept in an encrypted cookie for the callback, which completes it within ten
 * minutes.
 *
 * @param ctx The request which starts the authorization.
 * @param sso The organization's provider configuration.
 * @param purpose What the callback does besides signing in.
 * @param scope The scope to request from the provider.
 * @returns The provider authorization URL.
 */
export async function startOrganizationSsoAuthorization(
  ctx: Context,
  sso: OrganizationSso,
  purpose: Pick<OrganizationSsoFlow, 'candidateId' | 'credentials' | 'email' | 'linkUserId'>,
  scope = sso.scope,
): Promise<string> {
  const config = await getOrganizationOidcConfiguration(sso);
  const codeVerifier = randomPKCECodeVerifier();
  const flow: OrganizationSsoFlow = {
    organizationId: sso.OrganizationId,
    configurationUpdated: sso.configurationUpdated.getTime(),
    state: randomState(),
    nonce: randomNonce(),
    codeVerifier,
    expires: Date.now() + 10 * 60 * 1000,
    ...purpose,
  };
  const authorizationUrl = buildAuthorizationUrl(config, {
    redirect_uri: String(new URL('/callback', argv.host)),
    scope,
    state: flow.state,
    nonce: flow.nonce,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    code_challenge: await calculatePKCECodeChallenge(codeVerifier),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    code_challenge_method: 'S256',
    // eslint-disable-next-line @typescript-eslint/naming-convention
    ...(purpose.linkUserId ? { max_age: '0' } : {}),
  });
  ctx.cookies.set(
    organizationSsoFlowCookie,
    encrypt(JSON.stringify(flow), argv.aesSecret).toString('base64url'),
    {
      httpOnly: true,
      secure: new URL(argv.host).protocol === 'https:',
      sameSite: 'lax',
      signed: false,
      path: `/api/organizations/${sso.OrganizationId}/sso`,
      maxAge: 10 * 60 * 1000,
      overwrite: true,
    },
  );
  return String(authorizationUrl);
}
