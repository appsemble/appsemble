import { BaseActionDefinition } from './BaseActionDefinition.js';
import { extendJSONSchema } from './utils.js';

export const DialogActionDefinition = extendJSONSchema(BaseActionDefinition, {
  type: 'object',
  additionalProperties: false,
  required: ['type', 'blocks'],
  properties: {
    type: {
      enum: ['dialog'],
      description: `This action opens a pop-up dialog that can be used to seamlessly transition to a new set of blocks temporarily.

Dialogs can be closed by calling the [\`dialog.ok\`](#DialogOkActionDefinition) or
[\`dialog.error\`](#DialogErrorActionDefinition). Users can still manually close dialogs, which
should be supported by the app.

Blocks with the layout type \`float\` (e.g. \`action-button\`) do not work in this action.
`,
    },
    title: {
      description: 'An optional title to set in the dialog header.',
      $ref: '#/components/schemas/RemapperDefinition',
    },
    closable: {
      type: 'boolean',
      default: true,
      description:
        'Whether users are allowed to close the dialog by clicking outside of it or on the close button.',
    },
    fullscreen: {
      type: 'boolean',
      default: false,
      description:
        'Whether the dialog should be displayed full screen as if it’s a new page, or as a pop-up.',
    },
    blocks: {
      type: 'array',
      description: 'A list of blocks to display in the dialog.',
      items: { $ref: '#/components/schemas/BlockDefinition' },
    },
  },
});
