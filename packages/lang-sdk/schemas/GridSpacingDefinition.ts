import { type OpenAPIV3 } from 'openapi-types';

export const GridSpacingDefinition: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'Define the spacing for grid layout of the page',
  additionalProperties: false,
  properties: {
    unit: {
      type: 'string',
      description: '',
    },
    gap: {
      type: 'number',
      description: '',
    },
    padding: {
      type: 'number',
      description: '',
    },
  },
};
