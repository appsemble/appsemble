import { OpenAPIV3 } from 'openapi-types';

export const paths: OpenAPIV3.PathsObject = {
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
          description: 'An invite response',
          $ref: '#/components/responses/invite',
        },
      },
    },
  },
};
