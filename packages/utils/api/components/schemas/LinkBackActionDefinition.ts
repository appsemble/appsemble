import { BaseActionDefinition } from './BaseActionDefinition';
import { extendJSONSchema } from './utils';

export const LinkBackActionDefinition = extendJSONSchema(BaseActionDefinition, {
  type: 'object',
  additionalProperties: false,
  required: ['type'],
  properties: {
    type: {
      enum: ['link.back'],
      description: 'Link back to the previous page in the browser history.',
    },
  },
});
