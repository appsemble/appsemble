import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  post: {
    tags: ['main', 'auth', 'oauth2', 'authorization'],
    operationId: 'registerOAuth2Authorization',
    description: 'asd',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['authorizationUrl', 'code'],
            properties: {
              authorizationUrl: {
                type: 'string',
              },
              code: {
                type: 'string',
              },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: '',
      },
    },
  },
};
