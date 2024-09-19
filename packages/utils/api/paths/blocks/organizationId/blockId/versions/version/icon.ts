import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [
    { $ref: '#/components/parameters/organizationId' },
    { $ref: '#/components/parameters/blockId' },
    { $ref: '#/components/parameters/blockVersion' },
  ],
  get: {
    tags: ['common', 'block', 'version'],
    description: 'Get the icon of a block version.',
    operationId: 'getBlockVersionIcon',
    responses: {
      200: {
        description: 'The icon that represents the block.',
      },
    },
  },
};
