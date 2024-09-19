import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  post: {
    tags: ['main', 'auth'],
    description: 'Refresh an access token using the Appsemble studio',
    operationId: 'refreshToken',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['refresh_token'],
            properties: {
              refresh_token: {
                type: 'string',
                description: 'The refresh token to use for refreshing the session.',
              },
            },
          },
        },
      },
    },
    responses: { 200: { description: 'The token has been refreshed successfully.' } },
  },
};
