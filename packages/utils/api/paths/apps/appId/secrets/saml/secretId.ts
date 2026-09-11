import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [
    { $ref: '#/components/parameters/appId' },
    { $ref: '#/components/parameters/appSamlSecretId' },
  ],
  put: {
    tags: ['main', 'app', 'secret', 'saml'],
    operationId: 'updateAppSamlSecret',
    requestBody: {
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/AppSamlSecret' },
        },
      },
    },
    security: [{ studio: [] }],
    responses: {
      200: {
        description: 'The updated SAML secret.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/AppSamlSecret' },
          },
        },
      },
    },
  },
  delete: {
    tags: ['main', 'app', 'secret', 'saml'],
    operationId: 'deleteAppSamlSecret',
    security: [{ studio: [] }],
    responses: {
      204: {
        description: 'The deleted SAML secret.',
      },
    },
  },
};
