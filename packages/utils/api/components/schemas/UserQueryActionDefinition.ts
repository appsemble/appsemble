import { BaseActionDefinition } from './BaseActionDefinition.js';
import { extendJSONSchema } from './utils.js';

export const UserQueryActionDefinition = extendJSONSchema(BaseActionDefinition, {
  type: 'object',
  additionalProperties: false,
  required: [],
  properties: {
    type: {
      enum: ['user.query'],
      description: `Allows the user to fetch a list of accounts by their roles.

Does nothing if the user isn’t logged in.`,
    },
    roles: {
      $ref: '#/components/schemas/RemapperDefinition',
      description: 'The roles of the accounts that would be fetched.',
    },
  },
});
