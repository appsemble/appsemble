import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [
    { in: 'path', name: 'identityId', required: true, schema: { type: 'string', format: 'uuid' } },
  ],
  delete: {
    description:
      'Unlink an organization OIDC identity and revoke its sessions and derived credentials. Recent authentication and independent account recovery are required.',
    tags: ['main', 'user', 'current-user', 'auth', 'oidc'],
    operationId: 'deleteCurrentUserOidcIdentity',
    security: [{ studio: [] }],
    responses: {
      200: {
        description:
          'The identity is unlinked. sessionRevoked indicates whether the current Studio session was revoked.',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['sessionRevoked'],
              additionalProperties: false,
              properties: { sessionRevoked: { type: 'boolean' } },
            },
          },
        },
      },
      403: { description: 'Recent authentication is required.' },
      404: { description: 'The identity does not belong to the current account.' },
      409: {
        description: 'Unlinking would remove independent recovery or the last accessible Owner.',
      },
    },
  },
};
