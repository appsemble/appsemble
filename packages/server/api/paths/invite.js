export default {
  '/api/invites/{token}': {
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
          $ref: '#/components/responses/invite',
        },
      },
    },
  },
};
