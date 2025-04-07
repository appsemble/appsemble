import { BaseActionDefinition } from './BaseActionDefinition.js';
import { extendJSONSchema } from './utils.js';

export const MessageActionDefinition = extendJSONSchema(BaseActionDefinition, {
  type: 'object',
  additionalProperties: false,
  required: ['type', 'body'],
  properties: {
    type: {
      enum: ['message'],
      description: `Display a message to the user.

This is useful in combination with action chaining to notify users they have performed a certain action.
`,
    },
    body: {
      $ref: '#/components/schemas/RemapperDefinition',
      description: 'The body of the message.',
    },
    color: {
      enum: ['dark', 'primary', 'link', 'success', 'info', 'warning', 'danger'],
      default: 'info',
      description: 'The Bulma color to apply to the message.',
    },
    layout: {
      enum: ['bottom', 'top'],
      default: 'bottom',
      description: 'The position of the message on the screen.',
    },
    dismissable: {
      type: 'boolean',
      description:
        'Boolean value indicating whether the user is able to dismiss the message manually.',
    },
    timeout: {
      type: 'integer',
      default: 5000,
      description: 'The time in milliseconds how long the message should be visible.',
    },
  },
});
