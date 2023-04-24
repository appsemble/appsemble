import { type OpenAPIV3 } from 'openapi-types';

export const ResourceSubscription: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  additionalProperties: false,
  description: 'This describes how a user is subscribed to a resource.',
  properties: {
    create: {
      type: 'boolean',
      description: 'If true, the user is subscribed to any create actions for the resource type',
    },
    update: {
      type: 'boolean',
      description: 'If true, the user is subscribed to any update actions for the resource type',
    },
    delete: {
      type: 'boolean',
      description: 'If true, the user is subscribed to any delete actions for the resource type',
    },
    subscriptions: {
      type: 'object',
      description: 'A mapping of resource IDs to individual resource subscriptions',
      additionalProperties: {
        type: 'object',
        description: 'The subscription status of a user for a single resource.',
        additionalProperties: false,
        properties: {
          update: {
            type: 'boolean',
            description:
              'If true, the user is subscribed to update actions on this particular resource.',
          },
          delete: {
            type: 'boolean',
            description:
              'If true, the user will be notified when this particular resource is deleted.',
          },
        },
      },
    },
  },
};
