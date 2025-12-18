import { type OpenAPIV3 } from 'openapi-types';

export const GridLayoutDefinition: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: '',
  additionalProperties: false,
  properties: {
    columns: {
      type: 'number',
    },
    template: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
  },
};
