import { OpenAPIV3 } from 'openapi-types';

export const PageDefinition: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  allOf: [
    { $ref: '#/components/schemas/BasePageDefinition' },
    {
      type: 'object',
      additionalProperties: true,
      description: 'This describes what a page will look like in the app.',
      required: ['blocks', 'name'],
      properties: {
        blocks: {
          type: 'array',
          minItems: 1,
          description: 'The blocks that make up a page.',
          items: {
            $ref: '#/components/schemas/BlockDefinition',
          },
        },
      },
    },
  ],
};
