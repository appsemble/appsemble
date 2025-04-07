import { BaseActionDefinition } from './BaseActionDefinition.js';
import { extendJSONSchema } from './utils.js';

export const ResourceSubscriptionUnsubscribeActionDefinition = extendJSONSchema(
  BaseActionDefinition,
  {
    type: 'object',
    additionalProperties: false,
    required: ['type', 'resource'],
    properties: {
      type: {
        enum: ['resource.subscription.unsubscribe'],
        description: 'Unsubscribe from notifications on resource modifications.',
      },
      resource: {
        type: 'string',
        description: 'The type of the resource to unsubscribe from.',
      },
      action: {
        enum: ['create', 'delete', 'update'],
        description: 'The resource action type to unsubscribe from.',
        default: 'update',
      },
    },
  },
);
