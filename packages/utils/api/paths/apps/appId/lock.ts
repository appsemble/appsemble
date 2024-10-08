import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [{ $ref: '#/components/parameters/appId' }],
  post: {
    tags: ['main', 'app'],
    description: 'Update the locked property an app.',
    operationId: 'setAppLock',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['locked'],
            properties: {
              locked: {
                $ref: '#/components/schemas/App/properties/locked',
                description: 'Whether the app should be locked.',
              },
            },
          },
        },
      },
    },
    responses: {
      204: {
        description: 'Lock status successfully changed',
        content: {
          'application/zip': {},
        },
      },
    },
    security: [{ studio: [] }, { cli: ['apps:write'] }],
  },
};
