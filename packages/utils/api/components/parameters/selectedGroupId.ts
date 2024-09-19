import { type OpenAPIV3 } from 'openapi-types';

export const selectedGroupId: OpenAPIV3.ParameterObject = {
  name: 'selectedGroupId',
  in: 'query',
  description: 'The currently selected group of the app member.',
  schema: { type: 'number' },
};
