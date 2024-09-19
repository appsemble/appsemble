import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [{ $ref: '#/components/parameters/appId' }],
  post: {
    tags: ['main', 'app', 'secret', 'saml'],
    operationId: 'createAppSamlSecret',
    requestBody: {
      content: {
        'application/json': {
          schema: {},
        },
      },
    },
    security: [{ studio: [] }, { cli: ['apps:write'] }],
    responses: {
      201: {
        description: 'A list of the SAML secrets for the app.',
        content: {
          'application/json': {
            schema: {},
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
              items: {},
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
