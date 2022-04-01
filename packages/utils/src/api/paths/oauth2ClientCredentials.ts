import { OpenAPIV3 } from 'openapi-types';

export const paths: OpenAPIV3.PathsObject = {
  '/api/oauth2/client-credentials': {
    post: {
      description: 'Register new OAuth2 client credentials for the authenticated user.',
      tags: ['oauth2'],
      operationId: 'registerOAuth2ClientCredentials',
      requestBody: {
        description: 'The OAuth2 client credentials',
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/OAuth2ClientCredentials',
            },
          },
        },
      },
      responses: {
        201: {
          description: 'The newly created client credentials',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/OAuth2ClientCredentials',
              },
            },
          },
        },
      },
      security: [{ studio: [] }],
    },
    get: {
      description: 'Get a list of client credentials for the authenticated user',
      tags: ['oauth2'],
      operationId: 'listOAuth2ClientCredentials',
      responses: {
        200: {
          description: 'A list of client credentials entities.',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/OAuth2ClientCredentials',
                },
              },
            },
          },
        },
      },
      security: [{ studio: [] }],
    },
  },
  '/api/oauth2/client-credentials/{clientId}': {
    parameters: [
      {
        name: 'clientId',
        in: 'path',
        description:
          'The client id of the OAuth2 client credentials on which to perform an operation',
        required: true,
        schema: { type: 'string' },
      },
    ],
    delete: {
      description: 'Revoke the client credentials',
      tags: ['oauth2'],
      operationId: 'deleteOAuth2ClientCredentials',
      responses: {
        204: {
          description: 'The client credentials have been revoked successfully.',
        },
      },
      security: [{ studio: [] }],
    },
  },
};
