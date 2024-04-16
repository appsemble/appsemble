import { type OpenAPIV3 } from 'openapi-types';

export const appPath: OpenAPIV3.ParameterObject = {
  name: 'appPath',
  in: 'path',
  description: 'The app-path of the app on which to perform an operation',
  required: true,
  schema: { $ref: '#/components/schemas/App/properties/path' },
};
