import { BaseActionDefinition } from './BaseActionDefinition.js';
import { extendJSONSchema } from '../utils/extendJSONSchema.js';

export const GroupSelectedUpdateActionDefinition = extendJSONSchema(BaseActionDefinition, {
  type: 'object',
  additionalProperties: false,
  required: ['type', 'groupId'],
  properties: {
    type: {
      enum: ['group.selected.update'],
      description: 'Change the selected group of the logged in app member.',
    },
    groupId: {
      $ref: '#/components/schemas/RemapperDefinition',
      description: 'ID of the group to select',
    },
  },
});
