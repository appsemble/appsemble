import { BaseActionDefinition } from './BaseActionDefinition.js';
import { extendJSONSchema } from './utils.js';

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
      description: 'The password to log in with.',
    },
    email: {
      description: 'The email to log in with.',
    },
  },
});
