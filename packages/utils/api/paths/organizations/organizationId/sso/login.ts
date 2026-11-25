import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [{ $ref: '#/components/parameters/organizationId' }],
  get: {
    tags: ['main', 'organization', 'auth'],
    operationId: 'getOrganizationSsoLogin',
    description: 'Get the public sign-in options for an organization.',
    responses: {
      200: {
        description: 'The organization sign-in options.',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name', 'policy', 'allowedLoginMethods'],
              properties: {
                name: { type: 'string' },
                policy: { type: 'string', enum: ['optional', 'required', 'required-with-guests'] },
                allowedLoginMethods: { type: 'array', items: { type: 'string' } },
              },
            },
          },
        },
      },
    },
  },
  post: {
    tags: ['main', 'organization', 'auth'],
    operationId: 'startOrganizationSsoLogin',
    description: 'Start an organization OIDC sign-in or explicitly link an authenticated account.',
    security: [{ studio: [] }, {}],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              redirect: { type: 'string' },
              email: { type: 'string', format: 'email', maxLength: 320 },
              link: { type: 'boolean' },
              configuration: { $ref: '#/components/schemas/OrganizationSsoConfiguration' },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: 'The identity provider authorization URL.',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['authorizationUrl'],
              properties: { authorizationUrl: { type: 'string', format: 'uri' } },
            },
          },
        },
      },
    },
  },
};
