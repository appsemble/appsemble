import { type OpenAPIV3 } from 'openapi-types';

export const height: OpenAPIV3.ParameterObject = {
  name: 'height',
  in: 'query',
  description: 'Height the image should be rescaled to.',
  required: false,
  schema: { type: 'number' },
};
