import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [{ $ref: '#/components/parameters/appId' }],
  get: {
    tags: ['common', 'app', 'asset'],
    description: 'Check if an app has clonable assets.',
    operationId: 'checkAppClonableAssets',
    responses: {
      200: {
        description: 'Whether the app has clonable assets.',
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
