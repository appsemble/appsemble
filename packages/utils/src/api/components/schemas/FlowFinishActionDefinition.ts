import { BaseActionDefinition } from './BaseActionDefinition';
import { extendJSONSchema } from './utils';

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
