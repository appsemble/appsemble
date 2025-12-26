import { type OpenAPIV3 } from 'openapi-types';

export const DeviceGridLayoutDefinition: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'Grid layout definition for each device breakpoint',
  additionalProperties: false,
  properties: {
    spacing: {
      $ref: '#/components/schemas/GridSpacingDefinition',
      description: 'Spacing configuration for the grid',
      default: { unit: '1rem', gap: 1, padding: 1 },
    },
    layout: {
      $ref: '#/components/schemas/GridLayoutDefinition',
      description: 'Layout configuration for the grid',
      default: { columns: 1, template: ['main'] },
    },
  },
};
