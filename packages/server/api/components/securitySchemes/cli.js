export default {
  type: 'oauth2',
  description: `
    OAuth2 login for client credentials.

    For example the Appsemble CLI uses this.
  `,
  flows: {
    clientCredentials: {
      tokenUrl: '/api/oauth2/token',
      scopes: {
        'apps:write': 'Create and update apps',
        'blocks:write': 'Register and update blocks, and publish new block versions.',
        'organizations:styles:write': 'Edit organization themes.',
      },
    },
  },
};
