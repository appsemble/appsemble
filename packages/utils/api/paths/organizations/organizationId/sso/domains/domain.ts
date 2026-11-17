import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [
    { $ref: '#/components/parameters/organizationId' },
    { name: 'domain', in: 'path', required: true, schema: { type: 'string' } },
  ],
  delete: {
    tags: ['main', 'organization'],
    operationId: 'deleteOrganizationSsoDomain',
    description: 'Remove an email domain claim for single sign-on discovery.',
    security: [{ studio: [] }],
    responses: { 204: { description: 'The domain claim has been removed.' } },
  },
};
