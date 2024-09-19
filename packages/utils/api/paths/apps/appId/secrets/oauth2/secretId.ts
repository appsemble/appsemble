import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [
    { $ref: '#/components/parameters/appId' },
    { $ref: '#/components/parameters/appOAuth2SecretId' },
  ],
  get: {
    tags: ['main', 'app', 'secret', 'oauth2'],
    operationId: 'getAppOAuth2Secret',
    responses: {
      200: {
        description: `
            Get a partial app OAuth2 secret

            Only public facing values are output on this endpoint.
          `,
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: { $ref: '#/components/schemas/AppOAuth2Secret' },
            },
          },
        },
      },
    },
  },
  put: {
    tags: ['main', 'app', 'secret', 'oauth2'],
    operationId: 'updateAppOAuth2Secret',
    requestBody: {
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/AppOAuth2Secret' },
        },
      },
    },
    security: [{ studio: [] }],
    responses: {
      200: {
        description: 'The updated OAuth2 secret.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/AppOAuth2Secret' },
          },
        },
      },
    },
  },
  delete: {
    tags: ['main', 'app', 'secret', 'oauth2'],
    operationId: 'deleteAppOAuth2Secret',
    security: [{ studio: [] }],
    responses: {
      204: {
        description: 'The deleted OAuth2 secret.',
      },
    },
  },
};
