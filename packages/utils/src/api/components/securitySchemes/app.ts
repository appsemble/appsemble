import { OpenAPIV3 } from 'openapi-types';

const scopes = {
  email: 'Read the user email address.',
  openid: 'Login the user to the requesting app using OpenID.',
  profile: 'Read the user profile, including the display name and profile picture.',
  'resources:manage': 'Manage app resources on behalf of a user.',
  'teams:read': 'Read the teams the user is a part of.',
  'teams:write': 'Add new members to a team.',
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
      tokenUrl: '/oauth2/token',
      refreshUrl: '/oauth2/token',
      scopes,
    },
    password: {
      tokenUrl: '/oauth2/token',
      refreshUrl: '/oauth2/token',
      scopes,
    },
  },
};
