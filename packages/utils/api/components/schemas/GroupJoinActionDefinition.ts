import { BaseActionDefinition } from './BaseActionDefinition.js';
import { extendJSONSchema } from './utils.js';

export const GroupJoinActionDefinition = extendJSONSchema(BaseActionDefinition, {
  type: 'object',
  additionalProperties: false,
  required: ['type'],
  properties: {
    type: {
      enum: ['group.join'],
      description: 'Allow a user to join a group.',
    },
  },
});
