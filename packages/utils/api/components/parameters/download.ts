import { type OpenAPIV3 } from 'openapi-types';

export const download: OpenAPIV3.ParameterObject = {
  name: 'download',
  in: 'query',
  description: 'Serve the original asset binary instead of an image derivative.',
  required: false,
  schema: { type: 'boolean' },
};
