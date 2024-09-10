import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [
    { $ref: '#/components/parameters/appId' },
    { $ref: '#/components/parameters/appOAuth2SecretId' },
  ],
  post: {
    tags: ['main', 'app', 'secret', 'oauth2'],
    operationId: 'verifyAppOAuth2SecretCode',
    security: [{ studio: [] }, {}],
    requestBody: {
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['code', 'scope', 'redirectUri', 'timezone'],
            properties: {
              code: { type: 'string' },
              scope: { type: 'string' },
              redirectUri: { type: 'string' },
              timezone: { type: 'string' },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: `
            Get a partial app OAuth2 secret

            Only public facing values are output on this endpoint.
          `,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                code: { type: 'string' },
              },
            },
          },
        },
      },
    },
  },
};
