import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [
    { $ref: '#/components/parameters/organizationId' },
    { $ref: '#/components/parameters/blockId' },
  ],
  get: {
    tags: ['common', 'block'],
    description: 'Get a single block',
    operationId: 'getBlock',
    responses: {
      200: {
        description: 'The latest version of the block that matches the given id.',
        $ref: '#/components/responses/blockVersion',
      },
    },
  },
};
