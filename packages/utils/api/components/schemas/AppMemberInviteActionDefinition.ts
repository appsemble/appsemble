import { BaseActionDefinition } from './BaseActionDefinition.js';
import { extendJSONSchema } from './utils.js';

export const AppMemberInviteActionDefinition = extendJSONSchema(BaseActionDefinition, {
  type: 'object',
  additionalProperties: false,
  required: ['type', 'email', 'role'],
  properties: {
    type: {
      enum: ['app.member.invite'],
      description: `Allows the app member to invite another app member using an email address and a role.

Does nothing if the app member is not logged in.`,
    },
    email: {
      $ref: '#/components/schemas/RemapperDefinition',
      description: 'The email to invite.',
    },
    role: {
      $ref: '#/components/schemas/RemapperDefinition',
      description: 'The role of the invited app member.',
    },
  },
});
