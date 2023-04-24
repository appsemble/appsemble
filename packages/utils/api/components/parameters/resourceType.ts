import { type OpenAPIV3 } from 'openapi-types';

export const resourceType: OpenAPIV3.ParameterObject = {
  name: 'resourceType',
  in: 'path',
  description: 'The type of the resource on which to perform an operation',
  required: true,
  schema: {
    type: 'string',
  },
};
