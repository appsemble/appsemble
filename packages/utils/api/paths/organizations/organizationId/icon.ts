import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [{ $ref: '#/components/parameters/organizationId' }],
  get: {
    tags: ['organization'],
    description: 'Get the organization icon.',
    operationId: 'getOrganizationIcon',
    responses: {
      200: {
        description: 'The icon that represents the organization.',
      },
    },
  },
};
