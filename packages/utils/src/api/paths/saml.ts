import { OpenAPIV3 } from 'openapi-types';

export const paths: OpenAPIV3.PathsObject = {
  '/api/apps/{appId}/saml/{appSamlSecretId}/authn': {
    parameters: [
      { $ref: '#/components/parameters/appId' },
      { $ref: '#/components/parameters/appSamlSecretId' },
    ],
    post: {
      tags: ['secret'],
      operationId: 'createAuthnRequest',
      security: [{ studio: [] }, {}],
      responses: {
        201: {
          description: 'A list of the Saml secrets for the app.',
          content: {
            'application/json': {
              schema: {},
            },
          },
        },
      },
    },
  },
  '/api/apps/{appId}/saml/{appSamlSecretId}/acs': {
    parameters: [
      { $ref: '#/components/parameters/appId' },
      { $ref: '#/components/parameters/appSamlSecretId' },
    ],
    post: {
      tags: ['secret'],
      operationId: 'assertConsumerService',
      security: [{ studio: [] }, {}],
      requestBody: {
        content: {
          'application/x-www-form-urlencoded': {
            schema: {
              type: 'object',
              properties: {
                RelayState: { type: 'string' },
                SAMLResponse: { type: 'string' },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'A list of the Saml secrets for the app.',
          content: {
            'application/json': {
              schema: {},
            },
          },
        },
      },
    },
  },
};
