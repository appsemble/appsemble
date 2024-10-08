import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [{ $ref: '#/components/parameters/appId' }],
  post: {
    tags: ['main', 'app', 'secret', 'oauth2'],
    operationId: 'createAppOAuth2Secret',
    requestBody: {
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/AppOAuth2Secret' },
        },
      },
    },
    security: [{ studio: [] }, { cli: ['apps:write'] }],
    responses: {
      201: {
        description: 'A list of the OAuth2 secrets for the app.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/AppOAuth2Secret' },
          },
        },
      },
    },
  },
  get: {
    tags: ['main', 'app', 'secret', 'oauth2'],
    operationId: 'getAppOAuth2Secrets',
    security: [{ studio: [] }],
    responses: {
      200: {
        description: 'A list of the OAuth2 secrets for the app.',
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
  delete: {
    tags: ['main', 'app', 'secret', 'oauth2'],
    operationId: 'deleteAppOAuth2Secrets',
    security: [{ studio: [] }, { cli: ['apps:write'] }],
    responses: {
      204: {
        description: 'The deleted app OAuth2 secrets.',
      },
    },
  },
};
