import { BaseActionDefinition } from './BaseActionDefinition';
import { extendJSONSchema } from './utils';

export const DialogOkActionDefinition = extendJSONSchema(BaseActionDefinition, {
  type: 'object',
  additionalProperties: false,
  required: ['type'],
  properties: {
    type: {
      enum: ['dialog.ok'],
      description: `Close an open dialog.

The dialog action that opened the dialog will be rejected with the data passed to this action.
`,
    },
  },
});
