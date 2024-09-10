import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [{ $ref: '#/components/parameters/appId' }],
  get: {
    description: 'Get a single account that has been linked to an app and the current user',
    tags: ['main', 'user', 'current-user', 'app', 'member'],
    operationId: 'getCurrentUserAppMember',
    security: [{ studio: [] }],
    responses: {
      200: {
        description: 'A linked account',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/AppMember',
            },
          },
        },
      },
    },
  },
};
