import { type OpenAPIV3 } from 'openapi-types';

export const PageActionsDefinition: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'Action fired on page events',
  additionalProperties: false,
  properties: {
    onLoad: {
      $ref: '#/components/schemas/ActionDefinition',
      description:
        'This action is fired when a page loads, highly helpful in loading data for the page',
    },
  },
};
