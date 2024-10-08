import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
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
    tags: ['main', 'user', 'current-user', 'auth', 'oauth2', 'client-credentials'],
    operationId: 'deleteCurrentUserOAuth2ClientCredentials',
    responses: {
      204: {
        description: 'The client credentials have been revoked successfully.',
      },
    },
    security: [{ studio: [] }],
  },
};
