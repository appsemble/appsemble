import { BaseActionDefinition } from './BaseActionDefinition';
import { extendJSONSchema } from './utils';

export const LinkNextActionDefinition = extendJSONSchema(BaseActionDefinition, {
  type: 'object',
  additionalProperties: false,
  required: ['type'],
  properties: {
    type: {
      enum: ['link.next'],
      description: 'Link to the next page in the browser history.',
    },
  },
});
