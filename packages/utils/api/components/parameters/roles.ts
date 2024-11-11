import { type OpenAPIV3 } from 'openapi-types';

export const roles: OpenAPIV3.ParameterObject = {
  name: 'roles',
  in: 'query',
  description: 'The roles of app members on which to perform an operation',
  schema: {
    type: 'string',
  },
};
