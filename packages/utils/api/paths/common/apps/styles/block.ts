import { type OpenAPIV3 } from 'openapi-types';

export const paths: OpenAPIV3.PathsObject = {
  '/api/apps/{appId}/style/block/@{organizationId}/{blockId}': {
    parameters: [
      { $ref: '#/components/parameters/appId' },
      { $ref: '#/components/parameters/organizationId' },
      { $ref: '#/components/parameters/blockId' },
    ],
    get: {
      tags: ['common', 'app'],
      description: 'Get the app style for a block.',
      operationId: 'getAppBlockStyle',
      responses: {
        200: {
          description: 'The stylesheet associated with this block for this app.',
          content: {
            'text/css': {},
          },
        },
      },
    },
  },
};
