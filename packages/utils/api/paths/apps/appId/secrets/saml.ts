import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [{ $ref: '#/components/parameters/appId' }],
  post: {
    tags: ['main', 'app', 'secret', 'saml'],
    operationId: 'createAppSamlSecret',
    requestBody: {
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/AppSamlSecret' },
        },
      },
    },
    security: [{ studio: [] }, { cli: ['apps:write'] }],
    responses: {
      201: {
        description: 'A list of the SAML secrets for the app.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/AppSamlSecret' },
          },
        },
      },
    },
  },
  get: {
    tags: ['main', 'app', 'secret', 'saml'],
    operationId: 'getAppSamlSecrets',
    security: [{ studio: [] }],
    responses: {
      200: {
        description: 'A list of the SAML secrets for the app.',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: { $ref: '#/components/schemas/AppSamlSecret' },
            },
          },
        },
      },
    },
  },
  delete: {
    tags: ['main', 'app', 'secret', 'saml'],
    operationId: 'deleteAppSamlSecrets',
    security: [{ studio: [] }, { cli: ['apps:write'] }],
    responses: {
      204: {
        description: 'The deleted app saml secrets.',
      },
    },
  },
};
