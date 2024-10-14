import { type OpenAPIV3 } from 'openapi-types';

export const PageActionsDefinition: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'Action fired on page events',
  additionalProperties: false,
  properties: {
    onLoad: {
      $ref: '#/components/schemas/ActionDefinition',
      description: '',
    },
  },
};
