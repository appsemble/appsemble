import { type OpenAPIV3 } from 'openapi-types';

export const GridSpacingDefinition: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'Define the spacing for grid layout of the page',
  additionalProperties: false,
  properties: {
    unit: {
      type: 'string',
      description: 'CSS unit for spacing calculations (e.g., "1rem", "8px")',
      default: '1rem',
    },
    gap: {
      type: 'number',
      description: 'Gap multiplier between grid items',
      default: 1,
      minimum: 0,
    },
    padding: {
      type: 'number',
      description: 'Padding multiplier around the grid',
      default: 1,
      minimum: 0,
    },
  },
};
