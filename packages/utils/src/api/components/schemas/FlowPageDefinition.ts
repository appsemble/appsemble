import { BasePageDefinition } from './BasePageDefinition';
import { extendJSONSchema } from './utils';

export const FlowPageDefinition = extendJSONSchema(BasePageDefinition, {
  type: 'object',
  description: 'This describes what a page will look like in the app.',
  required: ['type', 'subPages'],
  additionalProperties: false,
  properties: {
    type: {
      enum: ['flow'],
    },
    subPages: {
      type: 'array',
      minItems: 1,
      description: "Sub pages belonging to this page's flow.",
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
