import { BaseActionDefinition } from './BaseActionDefinition.js';
import { extendJSONSchema } from '../utils/extendJSONSchema.js';

export const LinkActionDefinition = extendJSONSchema(BaseActionDefinition, {
  type: 'object',
  additionalProperties: false,
  required: ['type', 'to'],
  properties: {
    type: {
      enum: ['link'],
      description:
        'The link action can be used to redirect the user to other pages or absolute URLs.',
    },
    to: {
      anyOf: [
        {
          type: 'string',
        },
        {
          type: 'array',
          items: { type: 'string' },
        },
        {
          $ref: '#/components/schemas/RemapperDefinition',
        },
      ],
      description:
        'The name of the page to link to. Subpages can be referred to using arrays. If this matches with an absolute URL, link will open this instead of matching it with a page or subpage.',
    },
  },
});
