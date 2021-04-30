import { OpenAPIV3 } from 'openapi-types';

export const SubPage: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'This describes what a sub page will look like in the app.',
  required: ['name', 'blocks'],
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
};
