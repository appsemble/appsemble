import { type OpenAPIV3 } from 'openapi-types';

export const serviceSecretId: OpenAPIV3.ParameterObject = {
  name: 'serviceSecretId',
  in: 'path',
  description: 'The id of the app service secret on which to perform an operation',
  required: true,
  schema: { type: 'string' },
};
