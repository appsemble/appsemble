import { BaseActionDefinition } from './BaseActionDefinition';
import { extendJSONSchema } from './utils';

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
    password: {
      description: 'The new password.',
    },
    email: {
      description: 'The new email address.',
    },
    displayName: {
      description: 'The new display name of the user.',
    },
    picture: {
      description: 'The new profile picture of the user.',
    },
    properties: {
      description: `The custom properties for the user.

Every value will be converted to a string.`,
    },
  },
});
