export const organizationSubscriptionId = {
  name: 'organizationSubscriptionId',
  required: true,
  in: 'path',
  description: 'The ID of the subscription on which to perform an operation',
  schema: { $ref: '#/components/schemas/OrganizationSubscription/properties/id' },
};
