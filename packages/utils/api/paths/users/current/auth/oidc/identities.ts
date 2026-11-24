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
                required: ['id', 'issuer', 'subject', 'username', 'organizations'],
                additionalProperties: false,
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  issuer: { type: 'string', format: 'uri' },
                  subject: { type: 'string' },
                  username: {
                    type: 'string',
                    nullable: true,
                    description:
                      'The provider account: its email address, or its preferred username without one.',
                  },
                  organizations: {
                    type: 'array',
                    description: 'The organizations of the account which sign in with this issuer.',
                    items: {
                      type: 'object',
                      required: ['id', 'name', 'provider'],
                      additionalProperties: false,
                      properties: {
                        id: { $ref: '#/components/schemas/Organization/properties/id' },
                        name: { type: 'string', nullable: true },
                        provider: {
                          type: 'string',
                          description: 'The name of the organization single sign-on provider.',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};
