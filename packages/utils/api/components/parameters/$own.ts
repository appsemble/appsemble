import { type OpenAPIV3 } from 'openapi-types';

export const $own: OpenAPIV3.ParameterObject = {
  name: '$own',
  schema: { type: 'boolean' },
  description: 'If only the resources created by the authenticated app member should be included',
  in: 'query',
};
