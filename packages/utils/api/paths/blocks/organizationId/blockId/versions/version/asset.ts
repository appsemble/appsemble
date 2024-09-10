import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [
    { $ref: '#/components/parameters/organizationId' },
    { $ref: '#/components/parameters/blockId' },
    { $ref: '#/components/parameters/blockVersion' },
    {
      name: 'filename',
      in: 'query',
      description: 'The file name of the block asset to download',
      schema: { type: 'string' },
    },
  ],
  get: {
    tags: ['common', 'block', 'version', 'asset'],
    description: 'Download a single block asset',
    operationId: 'getBlockVersionAsset',
    responses: {
      200: {
        description: 'The asset that has been requested.',
      },
    },
  },
};
