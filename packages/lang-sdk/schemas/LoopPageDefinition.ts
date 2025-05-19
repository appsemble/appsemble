import { BasePageDefinition } from './BasePageDefinition.js';
import { extendJSONSchema } from './utils/extendJSONSchema.js';

export const LoopPageDefinition = extendJSONSchema(BasePageDefinition, {
  type: 'object',
  description: 'Generates sub pages dynamically based on data and display in a flow page.',
  required: ['type', 'foreach', 'actions'],
  additionalProperties: false,
  properties: {
    type: {
      enum: ['loop'],
    },
    actions: {
      $ref: '#/components/schemas/LoopPageActionsDefinition',
    },
    foreach: {
      $ref: '#/components/schemas/SubPage',
    },
    progress: {
      description: 'The method that should be used to display the status of flow pages.',
      enum: ['corner-dots', 'hidden'],
    },
    retainFlowData: {
      type: 'boolean',
      description: `Whether to retain the flow data when navigating away to another page outside the flow.

By default the flow page retains it's data after navigating once. Set to false to clear it.
`,
      default: true,
    },
  },
});
