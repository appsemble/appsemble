import { type OpenAPIV3 } from 'openapi-types';

export const ResponsiveGridLayoutDefinition: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'Responsive grid layout',
  additionalProperties: false,
  minProperties: 1,
  properties: {
    mobile: {
      $ref: '#/components/schemas/DeviceGridLayoutDefinition',
    },
    tablet: {
      $ref: '#/components/schemas/DeviceGridLayoutDefinition',
    },
    desktop: {
      $ref: '#/components/schemas/DeviceGridLayoutDefinition',
    },
  },
};
