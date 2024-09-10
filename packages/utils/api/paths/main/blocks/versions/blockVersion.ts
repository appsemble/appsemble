import { type OpenAPIV3 } from 'openapi-types';

export const paths: OpenAPIV3.PathsObject = {
  '/api/blocks/@{organizationId}/{blockId}/versions/{blockVersion}': {
    parameters: [
      { $ref: '#/components/parameters/organizationId' },
      { $ref: '#/components/parameters/blockId' },
      { $ref: '#/components/parameters/blockVersion' },
    ],
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
  },
};
