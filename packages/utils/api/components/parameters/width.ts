import { type OpenAPIV3 } from 'openapi-types';

export const width: OpenAPIV3.ParameterObject = {
  name: 'width',
  in: 'query',
  description: 'Width the image should be rescaled to.',
  required: false,
  schema: { type: 'number' },
};
