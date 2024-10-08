import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [
    { $ref: '#/components/parameters/organizationId' },
    { $ref: '#/components/parameters/blockId' },
    { $ref: '#/components/parameters/blockVersion' },
    {
      in: 'path',
      name: 'language',
      schema: { type: 'string' },
      description: 'The language to get messages for.',
      required: true,
    },
  ],
  get: {
    tags: ['common', 'block', 'version', 'translation'],
    description: 'Get internationalized messages for a block.',
    operationId: 'getBlockVersionMessages',
    responses: {
      200: {
        description: 'A key/value mapping of block messages.',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              description: 'A key/value mapping of block messages.',
              additionalProperties: {
                type: 'string',
                description: 'A translated block message.',
              },
            },
          },
        },
      },
    },
  },
};
