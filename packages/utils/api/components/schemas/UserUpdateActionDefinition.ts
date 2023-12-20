import { BaseActionDefinition } from './BaseActionDefinition.js';
import { extendJSONSchema } from './utils.js';

export const UserUpdateActionDefinition = extendJSONSchema(BaseActionDefinition, {
  type: 'object',
  additionalProperties: false,
  required: [],
  properties: {
    type: {
      enum: ['user.update'],
      description: `Allows the user to update their existing account.

Does nothing if the user isn’t logged in.`,
    },
    name: {
      description: 'The new display name of the user.',
    },
    currentEmail: {
      description: 'The current email address of the user.',
    },
    newEmail: {
      description: 'The new email address.',
    },
    password: {
      description: 'The new password.',
    },
    properties: {
      description: `The custom properties for the user.

Every value will be converted to a string.`,
    },
    role: {
      description:
        "The role for the updated account. Defaults to the default role in the app's security definition.",
    },
  },
});
