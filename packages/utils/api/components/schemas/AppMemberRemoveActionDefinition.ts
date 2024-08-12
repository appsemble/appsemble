import { BaseActionDefinition } from './BaseActionDefinition.js';
import { extendJSONSchema } from './utils.js';

export const AppMemberRemoveActionDefinition = extendJSONSchema(BaseActionDefinition, {
  type: 'object',
  additionalProperties: false,
  required: ['type', 'id'],
  properties: {
    type: {
      enum: ['app.member.remove'],
      description: `Allows the app member to delete another app member.

Does nothing if the app member isn’t logged in.`,
    },
    id: {
      $ref: '#/components/schemas/RemapperDefinition',
      description: 'The id of the app member to be deleted.',
    },
  },
});
