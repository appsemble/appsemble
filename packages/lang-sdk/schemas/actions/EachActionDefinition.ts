import { BaseActionDefinition } from './BaseActionDefinition.js';
import { extendJSONSchema } from '../utils/extendJSONSchema.js';

export const EachActionDefinition = extendJSONSchema(BaseActionDefinition, {
  type: 'object',
  additionalProperties: false,
  required: ['type', 'do'],
  properties: {
    type: {
      enum: ['each'],
      description: `Run an action for each entry in an array.

The actions are run in parallel.

If the input is not an array, the action will be applied to the input instead.`,
    },
    serial: {
      description: 'Runs the action in series instead of parallel',
      type: 'boolean',
    },
    do: {
      description: 'This action is called for each item in the input array.',
      $ref: '#/components/schemas/ActionDefinition',
    },
  },
});
