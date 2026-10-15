import { BaseActionDefinition } from './BaseActionDefinition.js';
import { extendJSONSchema } from '../utils/extendJSONSchema.js';

export const ScrollActionDefinition = extendJSONSchema(BaseActionDefinition, {
  type: 'object',
  additionalProperties: false,
  required: ['type', 'to'],
  properties: {
    type: {
      enum: ['scroll'],
      description: 'Scroll the page to the top or the bottom.',
    },
    to: {
      enum: ['top', 'bottom'],
      description: 'Where on the page to scroll to.',
    },
  },
});
