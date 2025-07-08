import { BaseActionDefinition } from './BaseActionDefinition.js';
import { extendJSONSchema } from '../utils/extendJSONSchema.js';

export const ResourceSubscriptionStatusActionDefinition = extendJSONSchema(BaseActionDefinition, {
  type: 'object',
  additionalProperties: false,
  required: ['type', 'resource'],
  properties: {
    type: {
      enum: ['resource.subscription.status'],
      description:
        'Get the status of whether or not the user is subscriped to notifications for resource modifications.',
    },
    resource: {
      type: 'string',
      description: 'The type of the resource to get the subscription state for.',
    },
    action: {
      enum: ['create', 'delete', 'update'],
      description: 'The resource action type to get the subscription state for.',
      default: 'update',
    },
  },
});
