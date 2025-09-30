import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [{ $ref: '#/components/parameters/organizationSubscriptionId' }],
  patch: {
    tags: ['main', 'organization-subscription'],
    description: 'Patch a subscription',
    operationId: 'patchOrganizationSubscription',
    requestBody: {
      content: {
        'multipart/form-data': {
          schema: {
            type: 'object',
            properties: {
              cancelled: {
                $ref: '#/components/schemas/OrganizationSubscription/properties/cancelled',
              },
              cancellationReason: {
                $ref: '#/components/schemas/OrganizationSubscription/properties/cancellationReason',
              },
              expirationDate: {
                $ref: '#/components/schemas/OrganizationSubscription/properties/expirationDate',
              },
              subscriptionPlan: {
                $ref: '#/components/schemas/OrganizationSubscription/properties/subscriptionPlan',
              },
              renewalPeriod: {
                $ref: '#/components/schemas/OrganizationSubscription/properties/renewalPeriod',
              },
            },
          },
        },
      },
    },
    responses: {
      200: { $ref: '#/components/responses/organizationSubscription' },
    },
    security: [{ studio: [] }],
  },
};
