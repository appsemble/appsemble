import { type OpenAPIV3 } from 'openapi-types';

export const CustomFontDefinition: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'A custom font definition.',
  additionalProperties: false,
  required: ['source', 'family'],
  properties: {
    source: {
      description: 'Use a custom font.',
      enum: ['custom'],
    },
    family: {
      type: 'string',
      description: `The font family to use in the app.

Make sure the font is available using custom CSS.
`,
    },
  },
};
