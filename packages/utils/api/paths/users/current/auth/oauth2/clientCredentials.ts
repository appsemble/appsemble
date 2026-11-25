import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  post: {
    description: 'Register new OAuth2 client credentials for the authenticated user.',
    tags: ['main', 'user', 'current-user', 'auth', 'oauth2', 'client-credentials'],
    operationId: 'registerCurrentUserOAuth2ClientCredentials',
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
        description:
          'The newly created client credentials. For an organization SSO session, the identity provider URL which authorizes offline access for them instead; the sign-in callback then creates them.',
        content: {
          'application/json': {
            schema: {
              oneOf: [
                { $ref: '#/components/schemas/OAuth2ClientCredentials' },
                {
                  type: 'object',
                  required: ['authorizationUrl', 'organizationId'],
                  properties: {
                    authorizationUrl: { type: 'string', format: 'uri' },
                    organizationId: { type: 'string' },
                  },
                },
              ],
            },
          },
        },
      },
    },
    security: [{ studio: [] }],
  },
  get: {
    description: 'Get a list of client credentials for the authenticated user',
    tags: ['main', 'user', 'current-user', 'auth', 'oauth2', 'client-credentials'],
    operationId: 'listCurrentUserOAuth2ClientCredentials',
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
};
