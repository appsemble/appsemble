import { OpenAPIV3 } from 'openapi-types';

export const screenshotId: OpenAPIV3.ParameterObject = {
  name: 'screenshotId',
  in: 'path',
  description: 'The ID of the app an app screenshot',
  required: true,
  schema: { type: 'number' },
};
