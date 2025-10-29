import { BaseActionDefinition } from './BaseActionDefinition.js';
import { extendJSONSchema } from '../utils/extendJSONSchema.js';

export const GroupMemberCreateActionDefinition = extendJSONSchema(BaseActionDefinition, {
  type: 'object',
  additionalProperties: false,
  required: ['type'],
  properties: {
    type: {
      enum: ['group.member.create'],
      description: 'Invite an app member to join a group.',
    },
    id: {
      description: 'The ID of the group to invite the app member to.',
      $ref: '#/components/schemas/RemapperDefinition',
    },
    appMemberId: {
      description: 'The ID of the app member to invite',
      $ref: '#/components/schemas/RemapperDefinition',
    },
    role: {
      description: 'The role to invite the user as.',
      $ref: '#/components/schemas/RemapperDefinition',
    },
  },
});
