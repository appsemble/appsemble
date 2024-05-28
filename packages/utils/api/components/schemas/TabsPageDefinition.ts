import { BasePageDefinition } from './BasePageDefinition.js';
import { extendJSONSchema } from './utils.js';

export const TabsPageDefinition = extendJSONSchema(BasePageDefinition, {
  type: 'object',
  description: 'This describes what a page will look like in the app.',
  oneOf: [
    {
      required: ['type', 'tabs'],
    },
    {
      required: ['type', 'definition'],
    },
  ],
  additionalProperties: true,
  properties: {
    type: {
      enum: ['tabs'],
    },
    tabs: {
      type: 'array',
      minItems: 1,
      description: 'Each of the available tabs for the tabs page.',
      items: {
        $ref: '#/components/schemas/SubPage',
      },
    },
    definition: {
      type: 'object',
      additionalProperties: false,
      description: 'Generate tabs dynamically',
      required: ['events', 'foreach'],
      properties: {
        events: {
          $ref: '#/components/schemas/EventsDefinition',
        },
        foreach: {
          $ref: '#/components/schemas/SubPage',
        },
      },
    },
    actions: {
      $ref: '#/components/schemas/TabsPageActionsDefinition',
    },
  },
});
