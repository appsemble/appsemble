import { type OpenAPIV3 } from 'openapi-types';

export const PageLayoutDefinition: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'Grid layout of the page, define as an anchor to re-use across multiple pages',
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
