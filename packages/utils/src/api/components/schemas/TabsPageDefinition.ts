import { BasePageDefinition } from './BasePageDefinition';
import { extendJSONSchema } from './utils';

export const TabsPageDefinition = extendJSONSchema(BasePageDefinition, {
  type: 'object',
  description: 'This describes what a page will look like in the app.',
  required: ['type', 'subPages'],
  additionalProperties: true,
  properties: {
    type: {
      enum: ['tabs'],
    },
    subPages: {
      type: 'array',
      minItems: 1,
      description: "Sub pages belonging to this page's flow.",
      items: {
        $ref: '#/components/schemas/SubPage',
      },
    },
  },
});
