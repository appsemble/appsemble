import { BaseActionDefinition } from './BaseActionDefinition';
import { extendJSONSchema } from './utils';

export const TeamJoinActionDefinition = extendJSONSchema(BaseActionDefinition, {
  type: 'object',
  additionalProperties: false,
  required: ['type'],
  properties: {
    type: {
      enum: ['team.join'],
      description: 'Get a list of all of the user’s teams.',
    },
  },
});
