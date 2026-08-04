import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [
    { $ref: '#/components/parameters/appId' },
    { $ref: '#/components/parameters/assetId' },
    { $ref: '#/components/parameters/width' },
    { $ref: '#/components/parameters/height' },
  ],
  get: {
    tags: ['common', 'app', 'asset'],
    description:
      'Get a single asset. Public image delivery returns JPEG (or WebP for transparent sources) derivatives, capped to 1024px on the longest edge when no width and height are given.',
    operationId: 'getAppAssetById',
    responses: {
      200: {
        description: 'The asset that matches the given id.',
      },
    },
  },
  head: {
    tags: ['common', 'app', 'asset'],
    description:
      'Get the headers for a single asset. Image asset headers describe the stored source, not the derived codec returned by GET.',
    operationId: 'getAppAssetHeadersById',
    responses: {
      200: {
        description: 'The headers of the asset that matches the given id.',
      },
    },
  },
  delete: {
    tags: ['common', 'app', 'asset'],
    description: 'Remove an existing asset',
    operationId: 'deleteAppAsset',
    responses: {
      204: {
        description: 'The asset was successfully deleted.',
      },
    },
    security: [{ studio: [] }, { app: ['resources:manage'] }],
  },
};
