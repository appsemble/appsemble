const tokenUrl = '/api/oauth/token';
const scopes = {
  'apps:read': 'Read apps',
  'apps:write': 'Write apps',
};

export default {
  type: 'oauth2',
  flows: {
    password: {
      tokenUrl,
      refreshUrl: tokenUrl,
      scopes,
    },
    authorizationCode: {
      authorizationUrl: '/_/login',
      tokenUrl,
      refreshUrl: tokenUrl,
      scopes,
    },
  },
};
