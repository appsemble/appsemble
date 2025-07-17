import { type OpenAPIV3 } from 'openapi-types';

import { baseTheme, googleFonts } from '../constants/index.js';

export const GoogleFontDefinition: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'A Google font definition.',
  additionalProperties: false,
  required: ['family'],
  properties: {
    source: {
      description: 'Use a font from [Google Fonts](https://fonts.google.com).',
      enum: ['google'],
    },
    family: {
      enum: googleFonts,
      description: `The font to use in the app.

Any font available on [Google Fonts](https://fonts.google.com) may be used.
`,
      default: baseTheme.font,
    },
  },
};
