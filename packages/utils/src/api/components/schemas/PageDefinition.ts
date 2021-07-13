import { OpenAPIV3 } from 'openapi-types';

export const PageDefinition: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  allOf: [
    { $ref: '#/components/schemas/BasePageDefinition' },
    {
      type: 'object',
      additionalProperties: true,
      description: `The list of blocks that are displayed on the page.

Each page requires at least one block. Blocks are displayed in the order that they are defined in
the list.
`,
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
