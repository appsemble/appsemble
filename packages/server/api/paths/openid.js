export default {
  '/api/userinfo': {
    get: {
      tags: ['openid', 'user'],
      description: 'Get the user information formatted as OpenID user info.',
      operationId: 'getUserInfo',
      security: [{ studio: [] }],
    },
  },
};
