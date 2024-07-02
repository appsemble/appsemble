import { type OpenAPIV3 } from 'openapi-types';

export const paths: OpenAPIV3.PathsObject = {
  '/api/apps/{appId}/saml/{appSamlSecretId}/authn': {
    parameters: [
      { $ref: '#/components/parameters/appId' },
      { $ref: '#/components/parameters/appSamlSecretId' },
    ],
    post: {
      tags: ['main', 'app', 'saml'],
      operationId: 'createAppSamlAuthnRequest',
      security: [{ studio: [] }, {}],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                redirectUri: { type: 'string' },
                scope: { type: 'string' },
                state: { type: 'string' },
                timezone: { enum: Intl.supportedValuesOf('timeZone') },
              },
            },
          },
        },
      },
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
  },
  '/api/apps/{appId}/saml/{appSamlSecretId}/acs': {
    parameters: [
      { $ref: '#/components/parameters/appId' },
      { $ref: '#/components/parameters/appSamlSecretId' },
    ],
    post: {
      tags: ['main', 'app', 'saml'],
      operationId: 'assertAppSamlConsumerService',
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
        302: {
          description: 'A list of the SAML secrets for the app.',
          content: {
            'application/json': {
              schema: {},
            },
          },
        },
      },
    },
  },
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
