import { BaseActionDefinition } from './BaseActionDefinition.js';
import { extendJSONSchema } from './utils.js';

export const GroupMemberInviteActionDefinition = extendJSONSchema(BaseActionDefinition, {
  type: 'object',
  additionalProperties: false,
  required: ['type'],
  properties: {
    type: {
      enum: ['group.member.invite'],
      description: 'Invite an app member to join a group.',
    },
    id: {
      description: 'The ID of the group to invite the app member to.',
      $ref: '#/components/schemas/RemapperDefinition',
    },
    email: {
      description: 'The email address of the user to invite.',
      $ref: '#/components/schemas/RemapperDefinition',
    },
    role: {
      description: 'The role to invite the user as.',
      $ref: '#/components/schemas/RemapperDefinition',
    },
  },
});
