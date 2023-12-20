import { type OpenAPIV3 } from 'openapi-types';

export const roles: OpenAPIV3.ParameterObject = {
  name: 'roles',
  in: 'query',
  description: 'The roles of users on which to perform an operation',
  required: true,
  schema: {
    type: 'array',
    items: {
      $ref: '#/components/schemas/AppAccount/properties/role',
    },
  },
};
