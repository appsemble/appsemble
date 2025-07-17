import { BaseActionDefinition } from './BaseActionDefinition.js';
import { extendJSONSchema } from '../utils/extendJSONSchema.js';

export const ResourceSubscriptionSubscribeActionDefinition = extendJSONSchema(
  BaseActionDefinition,
  {
    type: 'object',
    additionalProperties: false,
    required: ['type', 'resource'],
    properties: {
      type: {
        enum: ['resource.subscription.subscribe'],
        description: 'Subscribe to notifications on resource modifications.',
      },
      resource: {
        type: 'string',
        description: 'The type of the resource to subscribe to.',
      },
      action: {
        enum: ['create', 'delete', 'update'],
        description: 'The resource action type to subscribe to.',
        default: 'update',
      },
    },
  },
);
