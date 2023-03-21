import { type OpenAPIV3 } from 'openapi-types';

export const appServiceId: OpenAPIV3.ParameterObject = {
  name: 'appServiceId',
  in: 'path',
  description: 'The id of the app service secret on which to perform an operation',
  required: true,
  schema: { type: 'string' },
};
