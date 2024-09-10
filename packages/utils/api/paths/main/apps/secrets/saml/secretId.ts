import { type OpenAPIV3 } from 'openapi-types';

export const paths: OpenAPIV3.PathsObject = {
  '/api/apps/{appId}/secrets/saml/{appSamlSecretId}': {
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
            schema: {},
          },
        },
      },
      security: [{ studio: [] }],
      responses: {
        200: {
          description: 'The updated SAML secret.',
          content: {
            'application/json': {
              schema: {},
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
  },
};
