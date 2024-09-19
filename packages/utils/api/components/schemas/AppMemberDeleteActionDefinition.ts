import { BaseActionDefinition } from './BaseActionDefinition.js';
import { extendJSONSchema } from './utils.js';

export const AppMemberDeleteActionDefinition = extendJSONSchema(BaseActionDefinition, {
  type: 'object',
  additionalProperties: false,
  required: ['type', 'sub'],
  properties: {
    type: {
      enum: ['app.member.delete'],
      description: `Allows the app member to delete another app member.

Does nothing if the app member isn’t logged in.`,
    },
    sub: {
      $ref: '#/components/schemas/RemapperDefinition',
      description: 'The id of the app member to be deleted.',
    },
  },
});
