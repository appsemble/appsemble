import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
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
};
