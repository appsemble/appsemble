import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [{ $ref: '#/components/parameters/appId' }],
  get: {
    tags: ['common', 'app', 'resource'],
    description: 'Check if an app has clonable resources.',
    operationId: 'checkAppClonableResources',
    responses: {
      200: {
        description: 'Whether the app has clonable resources.',
        content: {
          'application/json': {
            schema: { type: 'boolean' },
          },
        },
      },
    },
    security: [{ studio: [] }, {}],
  },
};
