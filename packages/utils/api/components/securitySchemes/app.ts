import { type OpenAPIV3 } from 'openapi-types';

const scopes = {
  email: 'Read the user email address.',
  openid: 'Login the user to the requesting app using OpenID.',
  profile: 'Read the user profile, including the display name and profile picture.',
  'resources:manage': 'Manage app resources on behalf of a user.',
  'groups:read': 'Read the groups the user is a part of.',
  'groups:write': 'Add new members to a group.',
};

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
