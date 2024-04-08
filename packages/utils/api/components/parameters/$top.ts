import { type OpenAPIV3 } from 'openapi-types';

export const $top: OpenAPIV3.ParameterObject = {
  name: '$top',
  in: 'query',
  description: 'Limit the number of entities returned.',
  schema: { type: 'integer', minimum: 0 },
};
