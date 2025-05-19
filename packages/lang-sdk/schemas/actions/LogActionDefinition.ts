import { BaseActionDefinition } from './BaseActionDefinition.js';
import { extendJSONSchema } from '../utils/extendJSONSchema.js';

export const LogActionDefinition = extendJSONSchema(BaseActionDefinition, {
  type: 'object',
  additionalProperties: false,
  required: ['type'],
  properties: {
    type: {
      enum: ['log'],
      description: `Output the result of the action into the console.

This is mostly useful for debugging blocks during development.
`,
    },
    level: {
      enum: ['error', 'info', 'warn'],
      default: 'info',
      description: 'The logging level on which to log.',
    },
  },
});
