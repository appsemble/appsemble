import { type OpenAPIV3 } from 'openapi-types';

export const endpoint: OpenAPIV3.ParameterObject = {
  name: 'endpoint',
  in: 'query',
  description: 'The URL of the endpoint associated with the subscription.',
  required: true,
  schema: { type: 'string', format: 'uri' },
};
