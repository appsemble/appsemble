export default {
  '/invites/{token}': {
    parameters: [
      {
        name: 'token',
        in: 'path',
        description: 'The token of the invite.',
        required: true,
        schema: { type: 'string' },
      },
    ],
    get: {
      tags: ['organization'],
      description: 'Fetch information about an invite.',
      operationId: 'getInvitation',
      responses: {
        200: {
          description: 'An invite response',
          $ref: '#/components/responses/invite',
        },
      },
    },
  },
};
