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
        "On [flow pages](#flow-page-definition-sub-pages), cancel the ongoing flow and invoke the page's [`onFlowFinish`](#flow-page-actions-definition-on-flow-finish) action.",
    },
  },
});
