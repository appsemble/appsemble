import { type OpenAPIV3 } from 'openapi-types';

export const DeviceGridLayoutDefinition: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'Grid layout definition for each device',
  additionalProperties: false,
  properties: {
    spacing: {
      $ref: '#/components/schemas/GridSpacingDefinition',
    },
    layout: {
      $ref: '#/components/schemas/GridLayoutDefinition',
    },
  },
};
