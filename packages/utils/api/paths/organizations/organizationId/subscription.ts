import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [{ $ref: '#/components/parameters/organizationId' }],
  get: {
    tags: ['main', 'organization', 'organization-subscription'],
    description: 'Get the organization subscription.',
    operationId: 'getOrganizationOrganizationSubscription',
    responses: {
      200: { $ref: '#/components/responses/organizationSubscription' },
    },
    security: [{ studio: [] }],
  },
};
