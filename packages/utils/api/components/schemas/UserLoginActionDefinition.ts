import { BaseActionDefinition } from './BaseActionDefinition.js';
import { extendJSONSchema } from './utils.js';

export const UserLoginActionDefinition = extendJSONSchema(BaseActionDefinition, {
  type: 'object',
  additionalProperties: false,
  required: ['type'],
  properties: {
    type: {
      enum: ['user.login'],
      description: `Allows the user to login using an email address and a password.

Does nothing if the user is already logged in.`,
    },
    password: {
      description: 'The password to login with.',
    },
    email: {
      description: 'The email to login with.',
    },
  },
});
