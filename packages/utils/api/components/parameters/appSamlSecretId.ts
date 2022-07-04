import { OpenAPIV3 } from 'openapi-types';

export const appSamlSecretId: OpenAPIV3.ParameterObject = {
  name: 'appSamlSecretId',
  in: 'path',
  description: 'The ID of the app SAML secret on which to perform an operation',
  required: true,
  schema: {
    type: 'string',
    //  $ref: '#/components/schemas/AppSamlSecret/properties/id'
  },
};
