import { OpenAPIV3 } from 'openapi-types';

export const SecurityRoleDefinition: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  properties: {
    description: {
      type: 'string',
      description: 'The description of the role.',
    },
    defaultPage: {
      $ref: '#/components/schemas/App/properties/definition/properties/defaultPage',
    },
    inherits: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'string',
      },
    },
  },
};
