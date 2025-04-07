import { BaseActionDefinition } from './BaseActionDefinition.js';
import { extendJSONSchema } from './utils.js';

export const FlowBackActionDefinition = extendJSONSchema(BaseActionDefinition, {
  type: 'object',
  additionalProperties: false,
  required: ['type'],
  properties: {
    type: {
      enum: ['flow.back'],
      description: `On [flow pages](#flow-page-definition-sub-pages), return to the previous page if
it is present. If this is called on the first page, nothing happens.
`,
    },
  },
});
