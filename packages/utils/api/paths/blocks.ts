import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  post: {
    tags: ['main', 'block'],
    description: 'Publish a block.',
    operationId: 'createBlock',
    requestBody: {
      description: 'The new block version to publish.',
      content: {
        'multipart/form-data': {
          schema: {
            $ref: '#/components/schemas/BlockVersion',
          },
        },
      },
    },
    responses: {
      201: {
        $ref: '#/components/responses/blockVersion',
      },
    },
    security: [{ cli: ['blocks:write'] }],
  },
  get: {
    tags: ['common', 'block'],
    description: 'Get all block’s latest definitions.',
    operationId: 'queryBlocks',
    responses: {
      200: {
        description: 'The list of all latest block versions.',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/BlockVersion',
              },
            },
          },
        },
      },
    },
    security: [{ studio: [] }, {}],
  },
};
