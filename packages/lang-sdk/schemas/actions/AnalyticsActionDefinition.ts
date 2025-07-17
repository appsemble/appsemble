import { BaseActionDefinition } from './BaseActionDefinition.js';
import { extendJSONSchema } from '../utils/extendJSONSchema.js';

export const AnalyticsActionDefinition = extendJSONSchema(BaseActionDefinition, {
  type: 'object',
  additionalProperties: false,
  required: ['type', 'target'],
  properties: {
    type: {
      enum: ['analytics'],
      description: `This action sends a Google Analytics event.

It returns the input data.
`,
    },
    target: {
      type: 'string',
      description: 'The name of the analytics target event to send.',
    },
    config: {
      $ref: '#/components/schemas/RemapperDefinition',
      description: 'A remapper whose result will be sent to Google Analytics as additional context',
    },
  },
});
