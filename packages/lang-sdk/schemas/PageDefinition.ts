import { BasePageDefinition } from './BasePageDefinition.js';
import { extendJSONSchema } from './utils/extendJSONSchema.js';

export const PageDefinition = extendJSONSchema(BasePageDefinition, {
  type: 'object',
  additionalProperties: false,
  description: `The list of blocks that are displayed on the page.

Each page requires at least one block. Blocks are displayed in the order that they are defined in
the list.
`,
  required: ['blocks'],
  properties: {
    blocks: {
      type: 'array',
      minItems: 1,
      description: 'The blocks that make up a page.',
      items: {
        $ref: '#/components/schemas/BlockDefinition',
      },
    },
    actions: {
      $ref: '#/components/schemas/PageActionsDefinition',
    },
  },
});
