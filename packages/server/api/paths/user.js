export default {
  '/api/user': {
    get: {
      tags: ['template'],
      description: "Fetch the logged in user's profile.",
      operationId: 'getUser',
      responses: {
        200: {
          description: "The user's profile.",
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/User',
              },
            },
          },
        },
      },
      security: [{ apiUser: [] }],
    },
    put: {
      tags: ['template'],
      description: "Update the logged in user's profile.",
      operationId: 'updateUser',
      requestBody: {
        required: true,
        $ref: '#/components/requestBodies/user',
      },
      responses: {
        200: {
          description: "The user's profile.",
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/User',
              },
            },
          },
        },
      },
      security: [{ apiUser: [] }],
    },
  },
};
