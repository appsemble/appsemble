import { type OpenAPIV3 } from 'openapi-types';

export const paths: OpenAPIV3.PathsObject = {
  '/api/apps/{appId}/style/block/@{organizationId}/{blockId}': {
    parameters: [
      { $ref: '#/components/parameters/appId' },
      { $ref: '#/components/parameters/organizationId' },
      { $ref: '#/components/parameters/blockId' },
    ],
    post: {
      tags: ['main', 'app', 'block'],
      description: 'Upload a block stylesheet for this app.',
      operationId: 'setAppBlockStyle',
      requestBody: {
        description: 'The new app block stylesheet.',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['style'],
              properties: {
                style: {
                  type: 'string',
                },
                force: {
                  type: 'boolean',
                  writeOnly: true,
                  description: 'If this is true, the app lock is ignored.',
                },
              },
            },
          },
        },
      },
      responses: {
        204: {
          description: 'The block style has been updated successfully.',
        },
      },
      security: [{ studio: [] }, { cli: ['apps:write'] }],
    },
  },
};
