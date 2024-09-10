import { type OpenAPIV3 } from 'openapi-types';

export const paths: OpenAPIV3.PathsObject = {
  '/api/apps/{appId}/saml/{appSamlSecretId}/metadata.xml': {
    parameters: [
      { $ref: '#/components/parameters/appId' },
      { $ref: '#/components/parameters/appSamlSecretId' },
    ],
    get: {
      tags: ['main', 'app', 'saml'],
      operationId: 'getAppSamlEntityId',
      responses: {
        200: {
          description: 'Get the SAML entity ID metadata',
          content: {
            'application/xml': {
              schema: {},
            },
          },
        },
      },
    },
  },
};
