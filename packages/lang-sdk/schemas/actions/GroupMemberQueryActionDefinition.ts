import { BaseActionDefinition } from './BaseActionDefinition.js';
import { extendJSONSchema } from '../utils/extendJSONSchema.js';

export const GroupMemberQueryActionDefinition = extendJSONSchema(BaseActionDefinition, {
  type: 'object',
  additionalProperties: false,
  required: ['type', 'id'],
  properties: {
    type: {
      enum: ['group.member.query'],
      description: "Get a list of a group's members",
    },
    id: {
      description: 'The ID of a specific group to get the members from',
      $ref: '#/components/schemas/RemapperDefinition',
    },
  },
});
