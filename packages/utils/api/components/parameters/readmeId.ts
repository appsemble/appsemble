import { type OpenAPIV3 } from 'openapi-types';

export const readmeId: OpenAPIV3.ParameterObject = {
  name: 'readmeId',
  in: 'path',
  description: 'The id of an app readme',
  required: true,
  schema: { type: 'number' },
};
