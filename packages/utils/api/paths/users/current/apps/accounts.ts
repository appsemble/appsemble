import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  get: {
    description: 'Get the accounts that have been linked to an app and the user',
    tags: ['main', 'user', 'current-user', 'app', 'account'],
    operationId: 'getCurrentUserAppAccounts',
    security: [{ studio: [] }],
    responses: {
      200: {
        description: 'A list of linked accounts',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/AppAccount',
              },
            },
          },
        },
      },
    },
  },
};
