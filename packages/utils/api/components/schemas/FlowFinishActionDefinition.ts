import { BaseActionDefinition } from './BaseActionDefinition.js';
import { extendJSONSchema } from './utils.js';

export const FlowFinishActionDefinition = extendJSONSchema(BaseActionDefinition, {
  type: 'object',
  additionalProperties: false,
  required: ['type'],
  properties: {
    type: {
      enum: ['flow.finish'],
      description: `On [flow pages](#flow-page-definition-sub-pages), triggers the
[\`onFlowFinish\`](#flow-page-actions-definition-on-flow-finish) action on the page.
`,
    },
  },
});
