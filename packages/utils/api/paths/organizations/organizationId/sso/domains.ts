import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [{ $ref: '#/components/parameters/organizationId' }],
  get: {
    tags: ['main', 'organization'],
    operationId: 'getOrganizationSsoDomains',
    description: 'List the email domain claims for organization single sign-on discovery.',
    security: [{ studio: [] }],
    responses: {
      200: {
        description: 'The domain claims.',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: { $ref: '#/components/schemas/OrganizationSsoDomain' },
            },
          },
        },
      },
    },
  },
  post: {
    tags: ['main', 'organization'],
    operationId: 'createOrganizationSsoDomain',
    description: 'Create an unverified email domain claim for single sign-on discovery.',
    security: [{ studio: [] }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            additionalProperties: false,
            required: ['domain'],
            properties: { domain: { type: 'string', minLength: 1, maxLength: 253 } },
          },
        },
      },
    },
    responses: {
      201: {
        description: 'The domain claim and its DNS ownership challenge.',
        content: {
          'application/json': { schema: { $ref: '#/components/schemas/OrganizationSsoDomain' } },
        },
      },
    },
  },
};
