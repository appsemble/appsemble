import { BaseActionDefinition } from './BaseActionDefinition.js';
import { extendJSONSchema } from '../utils/extendJSONSchema.js';

export const GroupMemberRoleUpdateActionDefinition = extendJSONSchema(BaseActionDefinition, {
  type: 'object',
  additionalProperties: false,
  required: ['type', 'id', 'role'],
  properties: {
    type: {
      enum: ['group.member.role.update'],
      description: 'Update the role of a group member.',
    },
    id: {
      description: 'The id of the group member to update the role of.',
      $ref: '#/components/schemas/RemapperDefinition',
    },
    role: {
      description: 'The new role of the group member.',
      $ref: '#/components/schemas/RemapperDefinition',
    },
  },
});
