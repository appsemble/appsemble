import { BaseActionDefinition } from './BaseActionDefinition.js';
import { extendJSONSchema } from './utils.js';

export const UserRemoveActionDefinition = extendJSONSchema(BaseActionDefinition, {
  type: 'object',
  additionalProperties: false,
  required: ['email'],
  properties: {
    type: {
      enum: ['user.remove'],
      description: `Allows the user to delete an existing account.

Does nothing if the user isn’t logged in.`,
    },
    email: {
      $ref: '#/components/schemas/RemapperDefinition',
      description: 'The email of the account to be deleted.',
    },
  },
});
