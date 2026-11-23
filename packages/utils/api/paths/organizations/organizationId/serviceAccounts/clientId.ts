import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [
    { $ref: '#/components/parameters/organizationId' },
    {
      name: 'clientId',
      in: 'path',
      description: 'The client id of the service account.',
      required: true,
      schema: { type: 'string' },
    },
  ],
  delete: {
    tags: ['main', 'organization', 'member'],
    operationId: 'deleteOrganizationServiceAccount',
    description: 'Revoke a service account of the organization.',
    security: [{ studio: [] }],
    responses: {
      204: { description: 'The service account has been revoked.' },
    },
  },
};
