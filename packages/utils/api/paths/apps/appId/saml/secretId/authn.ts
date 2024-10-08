import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
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
};
