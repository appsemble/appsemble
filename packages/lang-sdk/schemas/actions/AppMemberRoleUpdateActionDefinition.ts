import { BaseActionDefinition } from './BaseActionDefinition.js';
import { extendJSONSchema } from '../utils/extendJSONSchema.js';

export const AppMemberRoleUpdateActionDefinition = extendJSONSchema(BaseActionDefinition, {
  type: 'object',
  additionalProperties: false,
  required: ['type', 'sub'],
  properties: {
    type: {
      enum: ['app.member.role.update'],
      description: `Allows the app member to update the role of another app member account.

Does nothing if the app member isn’t logged in.`,
    },
    sub: {
      $ref: '#/components/schemas/RemapperDefinition',
      description: 'The id of the app member.',
    },
    role: {
      $ref: '#/components/schemas/RemapperDefinition',
      description: `The updated role of the app member.

The role must exist in the roles property of the app's security definition or in the predefined app roles in the system -
\`Member\`, \`MembersManager\`, \`GroupMembersManager\`, \`GroupsManager\`, \`ResourcesManager\` and \`Owner\``,
    },
  },
});
