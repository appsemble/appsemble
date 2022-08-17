import { BaseActionDefinition } from './BaseActionDefinition.js';
import { extendJSONSchema } from './utils.js';

export const FlowToActionDefinition = extendJSONSchema(BaseActionDefinition, {
  type: 'object',
  additionalProperties: false,
  required: ['type', 'step'],
  properties: {
    type: {
      enum: ['flow.to'],
      description: 'On [flow pages](#flow-page-definition-sub-pages), move to a specific step.',
    },
    step: {
      $ref: '#/components/schemas/RemapperDefinition',
      description: `The name of the step to move to.

This is a remapper which gets called with the action input and context.
`,
    },
  },
});
