import { BaseActionDefinition } from './BaseActionDefinition.js';
import { extendJSONSchema } from '../utils/extendJSONSchema.js';

export const EventActionDefinition = extendJSONSchema(BaseActionDefinition, {
  type: 'object',
  additionalProperties: false,
  required: ['type', 'event'],
  properties: {
    type: {
      enum: ['event'],
      description: `This action allows for other blocks to emit data upon triggering the action.

This can be used to make blocks interact with each other, such as triggering the \`data-loader\`
block to refresh itself by sending an event action that matches the name of what the block is
listening to.
`,
    },
    event: {
      type: 'string',
      description: 'The name of the event to emit.',
    },
    waitFor: {
      type: 'string',
      description:
        'If specified, the action will wait for this event to have been emitted and respond with its data.',
    },
  },
});
