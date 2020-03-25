export default {
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
      scopes: {
        'resources:manage': 'Manage app resources on behalf of a user.',
      },
    },
    password: {
      tokenUrl: '/oauth2/token',
      refreshUrl: '/oauth2/token',
      scopes: {
        'resources:manage': 'Manage app resources on behalf of a user.',
      },
    },
  },
};
