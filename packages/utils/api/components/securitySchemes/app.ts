import { type OpenAPIV3 } from 'openapi-types';

import { appOAuth2Scopes as scopes } from '../../../constants/index.js';

export const app: OpenAPIV3.OAuth2SecurityScheme = {
  type: 'oauth2',
  description: `
    OAuth2 login for apps.

    The authorization code flow is recommended. The password flow exists for legacy apps and will be
    removed in the future.
  `,
  flows: {
    authorizationCode: {
      authorizationUrl: '/connect/authorize',
      tokenUrl: '/apps/{appId}/auth/oauth2/token',
      refreshUrl: '/apps/{appId}/auth/oauth2/token',
      scopes,
    },
    password: {
      tokenUrl: '/apps/{appId}/auth/oauth2/token',
      refreshUrl: '/apps/{appId}/auth/oauth2/token',
      scopes,
    },
  },
};
