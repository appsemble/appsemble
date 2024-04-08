import { type OpenAPIV3 } from 'openapi-types';

export const $skip: OpenAPIV3.ParameterObject = {
  name: '$skip',
  in: 'query',
  description: 'Start the query from an offset.',
  schema: { type: 'integer', minimum: 0 },
};
