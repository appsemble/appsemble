import { BaseActionDefinition } from './BaseActionDefinition.js';
import { extendJSONSchema } from './utils.js';

export const UserCreateActionDefinition = extendJSONSchema(BaseActionDefinition, {
  type: 'object',
  additionalProperties: false,
  required: ['email', 'password'],
  properties: {
    type: {
      enum: ['user.create'],
      description: `Allows the user to create a new account using an email address and a password.

Does nothing if the user is already logged in.`,
    },
    password: {
      description: 'The password to login with.',
    },
    email: {
      description: 'The email to login with.',
    },
    displayName: {
      description: 'The display name of the user.',
    },
    properties: {
      description: `The custom properties for the user.

Every value will be converted to a string.`,
    },
    role: {
      description:
        "The role for the created account. Defaults to the default role in the app's security definition.",
    },
  },
});
