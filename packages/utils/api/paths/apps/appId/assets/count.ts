import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [{ $ref: '#/components/parameters/appId' }],
  get: {
    tags: ['common', 'app', 'asset'],
    description: 'Get the number of assets in the app.',
    operationId: 'countAppAssets',
    responses: {
      200: {
        description: 'The number of assets in the app.',
        content: {
          'application/json': {
            schema: {
              type: 'number',
            },
          },
        },
      },
    },
    security: [{ studio: [] }, { app: ['resources:manage'] }, { cli: ['resources:read'] }, {}],
  },
};
