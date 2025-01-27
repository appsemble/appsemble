import { BaseActionDefinition } from './BaseActionDefinition.js';
import { extendJSONSchema } from './utils.js';

export const GroupMemberDeleteActionDefinition = extendJSONSchema(BaseActionDefinition, {
  type: 'object',
  additionalProperties: false,
  required: ['type', 'id'],
  properties: {
    type: {
      enum: ['group.member.delete'],
      description: 'Delete a group member from the group in which the invoking user is a member',
    },
    id: {
      $ref: '#/components/schemas/RemapperDefinition',
      description: 'The id of the group member to delete',
    },
  },
});
