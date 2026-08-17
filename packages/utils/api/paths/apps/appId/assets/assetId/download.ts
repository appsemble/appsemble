import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [
    { $ref: '#/components/parameters/appId' },
    { $ref: '#/components/parameters/assetId' },
  ],
  get: {
    tags: ['common', 'app', 'asset'],
    description: 'Download the original asset binary.',
    operationId: 'getOriginalAppAsset',
    responses: {
      200: {
        description: 'The original asset that matches the given id.',
      },
    },
    security: [{}, { studio: [] }, { app: [] }, { cli: ['assets:write'] }],
  },
};
