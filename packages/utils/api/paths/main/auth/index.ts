import { type OpenAPIV3 } from 'openapi-types';

import { paths as emailPaths } from './email/index.js';
import { paths as oauth2Paths } from './oauth2/authorizations/index.js';

export const paths: OpenAPIV3.PathsObject = {
  ...emailPaths,
  ...oauth2Paths,
  '/api/main/auth/refresh-token': {
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
  },
};
