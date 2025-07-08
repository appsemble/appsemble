import { BaseActionDefinition } from './BaseActionDefinition.js';
import { extendJSONSchema } from '../utils/extendJSONSchema.js';

export const FlowNextActionDefinition = extendJSONSchema(BaseActionDefinition, {
  type: 'object',
  additionalProperties: false,
  required: ['type'],
  properties: {
    type: {
      enum: ['flow.next'],
      description: `On [flow pages](#flow-page-definition-sub-pages), proceed to the next page if it
is present. Otherwise, the flow is considered to be complete and [\`flow.finish\`](#flowfinish) will
be called instead.
`,
    },
  },
});
