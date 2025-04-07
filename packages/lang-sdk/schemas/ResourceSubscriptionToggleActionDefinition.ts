import { BaseActionDefinition } from './BaseActionDefinition.js';
import { extendJSONSchema } from './utils.js';

export const ResourceSubscriptionToggleActionDefinition = extendJSONSchema(BaseActionDefinition, {
  type: 'object',
  additionalProperties: false,
  required: ['type', 'resource'],
  properties: {
    type: {
      enum: ['resource.subscription.toggle'],
      description: 'Toggle whether or not to receive notifications on resource modifications.',
    },
    resource: {
      type: 'string',
      description: 'The type of the resource to toggle the subscription state for.',
    },
    action: {
      enum: ['create', 'delete', 'update'],
      description: 'The resource action type to toggle the subscription state for.',
      default: 'update',
    },
  },
});
