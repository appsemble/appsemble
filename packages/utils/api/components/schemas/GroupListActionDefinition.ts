import { BaseActionDefinition } from './BaseActionDefinition.js';
import { extendJSONSchema } from './utils.js';

export const GroupListActionDefinition = extendJSONSchema(BaseActionDefinition, {
  type: 'object',
  additionalProperties: false,
  required: ['type'],
  properties: {
    type: {
      enum: ['group.list'],
      description: 'Get a list of all of the groups in an app.',
    },
  },
});
