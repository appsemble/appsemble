import { type OpenAPIV3 } from 'openapi-types';

export const GridSpacingDefinition: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'Define the spacing for grid layout of the page',
  additionalProperties: false,
  properties: {
    unit: {
      type: 'string',
      description:
        'CSS unit or custom property for spacing calculations (e.g., "1rem", "8px", "var(--grid-unit)")',
      default: '1rem',
      pattern:
        '^(?:-?(\\d+\\.?\\d*|\\.\\d+)(rem|em|px|%|vh|vw|vmin|vmax|ch|ex|cm|mm|in|pt|pc)|var\\(--[A-Za-z_][A-Za-z0-9_-]*\\))$',
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
