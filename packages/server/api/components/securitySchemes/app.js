export default {
  type: 'oauth2',
  description: `
    OAuth2 login for apps using an email address and password.

    Legacy apps use this.
  `,
  flows: {
    password: {
      tokenUrl: '/oauth2/token',
      refreshUrl: '/oauth2/token',
      scopes: {
        'resources:manage': 'Manage app resources on behalf of a user.',
      },
    },
  },
};
