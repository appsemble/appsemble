import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [{ $ref: '#/components/parameters/appId' }],
  get: {
    tags: ['main', 'app'],
    operationId: 'getAppWarnings',
    description: 'Get the configuration problems of an app.',
    security: [{ studio: [] }],
    responses: {
      200: {
        description: 'The app configuration warnings.',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                type: 'object',
                description: 'An app configuration problem, such as a secret without a value.',
                additionalProperties: false,
                required: ['code', 'type', 'name'],
                properties: {
                  code: { enum: ['missing-secret'] },
                  type: { enum: ['oauth2', 'scim', 'service'] },
                  id: { type: 'number' },
                  name: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  },
};
