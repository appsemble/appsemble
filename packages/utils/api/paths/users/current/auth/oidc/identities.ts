import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  get: {
    description: 'List the organization OIDC identities linked to the current account.',
    tags: ['main', 'user', 'current-user', 'auth', 'oidc'],
    operationId: 'getCurrentUserOidcIdentities',
    security: [{ studio: [] }],
    responses: {
      200: {
        description: 'The linked identities belonging to the current account.',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                type: 'object',
                required: ['id', 'issuer', 'subject'],
                additionalProperties: false,
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  issuer: { type: 'string', format: 'uri' },
                  subject: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  },
};
