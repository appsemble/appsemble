import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [{ $ref: '#/components/parameters/organizationId' }],
  get: {
    tags: ['main', 'organization'],
    operationId: 'getOrganizationSsoDomains',
    description: 'List the verified email domains for organization single sign-on discovery.',
    security: [{ studio: [] }],
    responses: {
      200: {
        description: 'The verified domains and the DNS TXT record value that proves ownership.',
        content: {
          'application/json': { schema: { $ref: '#/components/schemas/OrganizationSsoDomains' } },
        },
      },
    },
  },
  post: {
    tags: ['main', 'organization'],
    operationId: 'createOrganizationSsoDomain',
    description:
      'Add an email domain for single sign-on discovery after verifying its DNS TXT record.',
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
        description: 'The updated verified domains.',
        content: {
          'application/json': { schema: { $ref: '#/components/schemas/OrganizationSsoDomains' } },
        },
      },
    },
  },
};
