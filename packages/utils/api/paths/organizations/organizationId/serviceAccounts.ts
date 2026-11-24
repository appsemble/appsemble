import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [{ $ref: '#/components/parameters/organizationId' }],
  get: {
    tags: ['main', 'organization', 'member'],
    operationId: 'getOrganizationServiceAccounts',
    description: 'List the service accounts of an organization.',
    security: [{ studio: [] }],
    responses: {
      200: {
        description: 'The service accounts of the organization.',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: { $ref: '#/components/schemas/OrganizationServiceAccount' },
            },
          },
        },
      },
    },
  },
  post: {
    tags: ['main', 'organization', 'member'],
    operationId: 'createOrganizationServiceAccount',
    description: 'Create a service account for the organization.',
    security: [{ studio: [] }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/OrganizationServiceAccount' },
        },
      },
    },
    responses: {
      201: {
        description: 'The new service account, including its client secret.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/OrganizationServiceAccount' },
          },
        },
      },
    },
  },
};
