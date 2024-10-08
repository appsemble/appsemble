import { type OpenAPIV3 } from 'openapi-types';

export const groupId: OpenAPIV3.ParameterObject = {
  name: 'groupId',
  in: 'path',
  description: 'The ID of the group on which to perform an operation',
  required: true,
  schema: { type: 'number' },
};
