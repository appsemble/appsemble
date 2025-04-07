import { BaseActionDefinition } from './BaseActionDefinition.js';
import { extendJSONSchema } from './utils.js';

export const FlowCancelActionDefinition = extendJSONSchema(BaseActionDefinition, {
  type: 'object',
  additionalProperties: false,
  required: ['type'],
  properties: {
    type: {
      enum: ['flow.cancel'],
      description:
        "On [flow pages](../guides/page-types#flow-page), cancel the ongoing flow and invoke the page's [`onFlowFinish`](#flow-page-actions-definition-on-flow-finish) action.",
    },
  },
});
