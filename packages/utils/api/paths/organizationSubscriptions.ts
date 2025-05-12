import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  get: {
    tags: ['main', 'organizationSubscription'],
    description: 'Fetch the list of organizationSubscriptions.',
    operationId: 'getOrganizationSubscriptions',
    responses: {
      200: {
        description: 'The list of of organizationSubscriptions',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Subscription',
              },
            },
          },
        },
      },
    },
  },
};
