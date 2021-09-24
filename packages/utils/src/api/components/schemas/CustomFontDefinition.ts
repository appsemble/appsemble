import { OpenAPIV3 } from 'openapi-types';

export const CustomFontDefinition: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'A custom font definition.',
  required: ['source', 'family'],
  properties: {
    source: {
      description: 'Use a custom font.',
      enum: ['custom'],
    },
    family: {
      type: 'string',
      description: `The font family to use in the app.

It’s your responsibility as an app developer to make sure the font is available using custom CSS.
`,
    },
  },
};
