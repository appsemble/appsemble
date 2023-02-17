import { BaseActionDefinition } from './BaseActionDefinition.js';
import { extendJSONSchema } from './utils.js';

export const MatchActionDefinition = extendJSONSchema(BaseActionDefinition, {
  type: 'object',
  additionalProperties: false,
  required: ['type', 'match'],
  properties: {
    type: {
      enum: ['match'],
      description: `Run another action if one of the cases is true.

Only the first case that equals true is called.`,
    },
    match: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['case', 'action'],
        description: '',
        properties: {
          case: {
            $ref: '#/components/schemas/RemapperDefinition',
            description: 'The case to be matched.',
          },
          action: {
            $ref: '#/components/schemas/ActionDefinition',
            description: 'Action to be called if the case equals true.',
          },
        },
      },
    },
  },
});
