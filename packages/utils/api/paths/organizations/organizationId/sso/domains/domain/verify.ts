import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [
    { $ref: '#/components/parameters/organizationId' },
    { name: 'domain', in: 'path', required: true, schema: { type: 'string' } },
  ],
  post: {
    tags: ['main', 'organization'],
    operationId: 'verifyOrganizationSsoDomain',
    description: 'Verify an email domain claim using its DNS TXT ownership challenge.',
    security: [{ studio: [] }],
    responses: {
      200: {
        description: 'The verified domain claim.',
        content: {
          'application/json': { schema: { $ref: '#/components/schemas/OrganizationSsoDomain' } },
        },
      },
    },
  },
};
