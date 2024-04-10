import { type OpenAPIV3 } from 'openapi-types';

export const appVariableId: OpenAPIV3.ParameterObject = {
  name: 'appVariableId',
  in: 'path',
  description: 'The id of the app variable on which to perform an operation',
  required: true,
  schema: { type: 'string' },
};
