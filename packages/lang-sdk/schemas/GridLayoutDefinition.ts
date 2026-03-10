import { type OpenAPIV3 } from 'openapi-types';

export const GridLayoutDefinition: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'Grid layout configuration for columns and template areas',
  additionalProperties: false,
  properties: {
    columns: {
      type: 'number',
      description: 'Number of columns in the grid',
      default: 1,
      minimum: 1,
    },
    template: {
      type: 'array',
      description: 'Grid template areas - each string represents a row',
      items: {
        type: 'string',
      },
      default: ['main'],
    },
  },
};
