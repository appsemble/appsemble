import { BaseActionDefinition } from './BaseActionDefinition.js';
import { extendJSONSchema } from '../utils/extendJSONSchema.js';

export const AppMemberInviteActionDefinition = extendJSONSchema(BaseActionDefinition, {
  type: 'object',
  additionalProperties: false,
  required: ['type', 'email', 'roles'],
  properties: {
    type: {
      enum: ['app.member.invite'],
      description: `Allows the app member to invite another app member using an email address and one or more roles.

Does nothing if the app member is not logged in.`,
    },
    email: {
      $ref: '#/components/schemas/RemapperDefinition',
      description: 'The email to invite.',
    },
    roles: {
      $ref: '#/components/schemas/RemapperDefinition',
      description: 'The roles of the invited app member.',
    },
  },
});
