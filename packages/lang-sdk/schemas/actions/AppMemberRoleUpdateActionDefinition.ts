import { BaseActionDefinition } from './BaseActionDefinition.js';
import { extendJSONSchema } from '../utils/extendJSONSchema.js';

export const AppMemberRoleUpdateActionDefinition = extendJSONSchema(BaseActionDefinition, {
  type: 'object',
  additionalProperties: false,
  required: ['type', 'sub'],
  properties: {
    type: {
      enum: ['app.member.role.update'],
      description: `Allows the app member to update the roles of another app member account.

Does nothing if the app member isn’t logged in.`,
    },
    sub: {
      $ref: '#/components/schemas/RemapperDefinition',
      description: 'The id of the app member.',
    },
    roles: {
      $ref: '#/components/schemas/RemapperDefinition',
      description: `The updated roles of the app member.

Every role must exist in the roles property of the app's security definition.`,
    },
  },
});
