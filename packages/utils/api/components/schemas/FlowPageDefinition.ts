import { BasePageDefinition } from './BasePageDefinition.js';
import { extendJSONSchema } from './utils.js';

export const FlowPageDefinition = extendJSONSchema(BasePageDefinition, {
  type: 'object',
  description: 'Shows a set of sub pages in a certain order which the user can navigate through.',
  required: ['type', 'steps'],
  additionalProperties: false,
  properties: {
    type: {
      enum: ['flow'],
    },
    steps: {
      type: 'array',
      minItems: 2,
      description: "Steps belonging to this page's flow.",
      items: {
        $ref: '#/components/schemas/SubPage',
      },
    },
    actions: {
      $ref: '#/components/schemas/FlowPageActionsDefinition',
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
