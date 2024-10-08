import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [
    { $ref: '#/components/parameters/organizationId' },
    { $ref: '#/components/parameters/blockId' },
    { $ref: '#/components/parameters/blockVersion' },
  ],
  get: {
    tags: ['common', 'block', 'version'],
    description: 'Retrieve a single block version.',
    operationId: 'getBlockVersion',
    responses: {
      200: {
        $ref: '#/components/responses/blockVersion',
      },
    },
  },
  delete: {
    tags: ['main', 'block', 'version'],
    description: 'Delete a single block version.',
    operationId: 'deleteBlockVersion',
    responses: {
      204: {
        description: 'Block version has successfully been deleted',
      },
    },
    security: [{ cli: ['blocks:delete'] }],
  },
};
