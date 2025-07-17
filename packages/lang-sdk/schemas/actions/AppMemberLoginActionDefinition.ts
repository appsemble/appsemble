import { BaseActionDefinition } from './BaseActionDefinition.js';
import { extendJSONSchema } from '../utils/extendJSONSchema.js';

export const AppMemberLoginActionDefinition = extendJSONSchema(BaseActionDefinition, {
  type: 'object',
  additionalProperties: false,
  required: ['type'],
  properties: {
    type: {
      enum: ['app.member.login'],
      description: `Allows the app member to login using an email address and a password.

Does nothing if the app member is already logged in.`,
    },
    password: {
      $ref: '#/components/schemas/RemapperDefinition',
      description: 'The password to log in with.',
    },
    email: {
      $ref: '#/components/schemas/RemapperDefinition',
      description: 'The email to log in with.',
    },
  },
});
