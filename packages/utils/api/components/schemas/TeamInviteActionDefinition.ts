import { BaseActionDefinition } from './BaseActionDefinition.js';
import { extendJSONSchema } from './utils.js';

export const TeamInviteActionDefinition = extendJSONSchema(BaseActionDefinition, {
  type: 'object',
  additionalProperties: false,
  required: ['type'],
  properties: {
    type: {
      enum: ['team.invite'],
      description: 'Get a list of all of the user’s teams.',
    },
    id: {
      description: 'The ID of the team to invite the user to.',
      $ref: '#/components/schemas/RemapperDefinition',
    },
    email: {
      description: 'The email address of the user to invite.',
      $ref: '#/components/schemas/RemapperDefinition',
    },
    role: {
      description: 'The role to invite the user as.',
      $ref: '#/components/schemas/RemapperDefinition',
      default: 'member',
    },
  },
});
