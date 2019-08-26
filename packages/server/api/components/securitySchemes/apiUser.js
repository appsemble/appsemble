const tokenUrl = '/api/oauth/token';
const scopes = {
  'apps:read': 'Read apps, including private apps of the authenticated user.',
  'apps:write': 'Create, read, update, and delete apps to which the user has write access.',
  'blocks:write': 'Register and update blocks, and publish new block versions.',
  'organizations:read': 'Read organization information for the authenticated user.',
  'organizations:style': 'Update organization wide styles for apps or blocks',
  'organizations:write':
    'Create, read, update, and delete organizations to which the user has write access. This includes for example organization member management.',
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
      authorizationUrl: '/login',
      tokenUrl,
      refreshUrl: tokenUrl,
      scopes,
    },
  },
};
