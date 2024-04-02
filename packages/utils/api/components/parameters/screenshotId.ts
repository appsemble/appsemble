import { type OpenAPIV3 } from 'openapi-types';

export const screenshotId: OpenAPIV3.ParameterObject = {
  name: 'screenshotId',
  in: 'path',
  description: 'The id of an app screenshot',
  required: true,
  schema: { type: 'number' },
};
