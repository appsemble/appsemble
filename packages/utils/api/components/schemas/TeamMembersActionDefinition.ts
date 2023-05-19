import { BaseActionDefinition } from './BaseActionDefinition.js';
import { extendJSONSchema } from './utils.js';

export const TeamMembersActionDefinition = extendJSONSchema(BaseActionDefinition, {
  type: 'object',
  additionalProperties: false,
  required: ['type', 'id'],
  properties: {
    type: {
      enum: ['team.members'],
      description: "Get a list of a team's members",
    },
    id: {
      description: 'The ID of a specific team to get the members from',
      $ref: '#/components/schemas/RemapperDefinition',
    },
  },
});
