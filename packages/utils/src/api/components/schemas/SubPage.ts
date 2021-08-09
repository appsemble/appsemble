import { OpenAPIV3 } from 'openapi-types';

export const SubPage: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'This describes what a sub page will look like in the app.',
  required: ['blocks'],
  additionalProperties: false,
  properties: {
    name: {
      type: 'string',
      description: 'The name of the sub page.',
      minLength: 1,
      maxLength: 50,
    },
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
