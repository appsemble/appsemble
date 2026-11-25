import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  post: {
    tags: ['main', 'auth', 'email'],
    operationId: 'discoverOrganizationSso',
    description: 'Discover organization single sign-on providers for an email domain.',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            additionalProperties: false,
            required: ['email'],
            properties: {
              email: { type: 'string', format: 'email', maxLength: 320 },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: 'The configured providers matching the verified email domain.',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['organizations'],
              properties: {
                organizations: {
                  type: 'array',
                  items: {
                    type: 'object',
                    required: ['id', 'name', 'ssoName'],
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      ssoName: { type: 'string' },
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
