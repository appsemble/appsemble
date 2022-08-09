import { BasePageDefinition } from './BasePageDefinition.js';
import { extendJSONSchema } from './utils.js';

export const FlowPageDefinition = extendJSONSchema(BasePageDefinition, {
  type: 'object',
  description: 'This describes what a page will look like in the app.',
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
  },
});
