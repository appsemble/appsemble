import { type OpenAPIV3 } from 'openapi-types';

export const webhookSecretId: OpenAPIV3.ParameterObject = {
  name: 'webhookSecretId',
  in: 'path',
  description: 'The id of the app webhook secret on which to perform an operation',
  required: true,
  schema: { type: 'string' },
};
