import { type OpenAPIV3 } from 'openapi-types';

export const appOAuth2SecretId: OpenAPIV3.ParameterObject = {
  name: 'appOAuth2SecretId',
  in: 'path',
  description: 'The ID of the app OAuth2 secret on which to perform an operation',
  required: true,
  schema: { $ref: '#/components/schemas/AppOAuth2Secret/properties/id' },
};
