import { type OpenAPIV3 } from 'openapi-types';

export const view: OpenAPIV3.ParameterObject = {
  name: 'view',
  in: 'query',
  description: 'The view of the resource to fetch.',
  schema: { type: 'string' },
};
