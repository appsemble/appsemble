import { getSSRFProtectedAgents } from '@appsemble/node-utils';
import axios from 'axios';
import {
  allowInsecureRequests,
  type Configuration,
  customFetch,
  discovery,
  enableNonRepudiationChecks,
} from 'openid-client';

import { type OrganizationSso } from '../models/main/OrganizationSso.js';
import { argv } from './argv.js';
import { decrypt } from './crypto.js';

/**
 * Discover an organization's provider using the shared outbound request policy.
 *
 * @param sso The organization's provider configuration.
 * @returns The discovered OpenID Connect client configuration.
 */
export function getOrganizationOidcConfiguration(sso: OrganizationSso): Promise<Configuration> {
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
