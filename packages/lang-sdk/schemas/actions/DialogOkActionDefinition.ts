import { BaseActionDefinition } from './BaseActionDefinition.js';
import { extendJSONSchema } from '../utils/extendJSONSchema.js';

export const DialogOkActionDefinition = extendJSONSchema(BaseActionDefinition, {
  type: 'object',
  additionalProperties: false,
  required: ['type'],
  properties: {
    type: {
      enum: ['dialog.ok'],
      description: `Close an open dialog.

The dialog action that opened the dialog will be resolved with the data passed to this action.
`,
    },
  },
});
