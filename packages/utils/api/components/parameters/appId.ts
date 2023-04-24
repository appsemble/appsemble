import { type OpenAPIV3 } from 'openapi-types';

export const appId: OpenAPIV3.ParameterObject = {
  name: 'appId',
  in: 'path',
  description: 'The ID of the app on which to perform an operation',
  required: true,
  schema: { $ref: '#/components/schemas/App/properties/id' },
};
