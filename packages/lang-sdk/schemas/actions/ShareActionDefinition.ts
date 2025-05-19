import { BaseActionDefinition } from './BaseActionDefinition.js';
import { extendJSONSchema } from '../utils/extendJSONSchema.js';

export const ShareActionDefinition = extendJSONSchema(BaseActionDefinition, {
  type: 'object',
  additionalProperties: false,
  required: ['type'],
  properties: {
    type: {
      enum: ['share'],
      description: `The \`share\` action can be used to display a prompt that allows the user to share something with others, primarily via social media.

Depending on whether the user’s browser supports a native share function it will either display a
native dialog for sharing links, or display a more limited fallback in a dialog.
`,
    },
    url: {
      $ref: '#/components/schemas/RemapperDefinition',
      description: 'The url that is being shared.',
    },
    title: {
      $ref: '#/components/schemas/RemapperDefinition',
      description: 'The title that should be shared.',
    },
    text: {
      $ref: '#/components/schemas/RemapperDefinition',
      description: 'The main body that should be shared.',
    },
  },
});
