import { BaseActionDefinition } from './BaseActionDefinition.js';
import { extendJSONSchema } from './utils.js';

export const UserRegisterActionDefinition = extendJSONSchema(BaseActionDefinition, {
  type: 'object',
  additionalProperties: false,
  required: ['email', 'password'],
  properties: {
    type: {
      enum: ['user.register'],
      description: `Allows the user to register a new account using an email address and a password.

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
    picture: {
      description: 'The image to use for the profile picture of the user.',
    },
    properties: {
      description: `The custom properties for the user.

Every value will be converted to a string.`,
    },
    login: {
      description: 'Whether to login after registering.',
      default: true,
    },
  },
});
