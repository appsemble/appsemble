import { BaseActionDefinition } from './BaseActionDefinition.js';
import { extendJSONSchema } from '../utils/extendJSONSchema.js';

export const FlowFinishActionDefinition = extendJSONSchema(BaseActionDefinition, {
  type: 'object',
  additionalProperties: false,
  required: ['type'],
  properties: {
    type: {
      enum: ['flow.finish'],
      description: `On [flow pages](../guides/page-types#flow-page), triggers the
[\`onFlowFinish\`](#flow-page-actions-definition-on-flow-finish) action on the page.
`,
    },
  },
});
