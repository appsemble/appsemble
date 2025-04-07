import { type OpenAPIV3 } from 'openapi-types';

import { baseTheme } from '../constants/baseTheme.js';
import { hexColor } from '../constants/patterns.js';

export const Theme: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'A generic theme definition.',
  additionalProperties: false,
  minProperties: 1,
  properties: {
    themeColor: {
      type: 'string',
      pattern: hexColor.source,
      default: baseTheme.themeColor,
      description: `The generic theme color of the app.

This is used for example in the URL bar on Android.
`,
    },
    splashColor: {
      type: 'string',
      pattern: hexColor.source,
      default: baseTheme.splashColor,
      description: `The background color of the PWA splash screen.

This defaults to the theme color.
`,
    },
    primaryColor: {
      type: 'string',
      pattern: hexColor.source,
      default: baseTheme.primaryColor,
      description: `The primary color used within the app.

This is used in various elements like the navbar.
`,
    },
    linkColor: {
      type: 'string',
      pattern: hexColor.source,
      default: baseTheme.linkColor,
      description: 'The color used for links.',
    },
    infoColor: {
      type: 'string',
      pattern: hexColor.source,
      default: baseTheme.infoColor,
      description: 'The color used for informational messages.',
    },
    successColor: {
      type: 'string',
      pattern: hexColor.source,
      default: baseTheme.successColor,
      description: 'The color used for successful actions.',
    },
    warningColor: {
      type: 'string',
      pattern: hexColor.source,
      default: baseTheme.warningColor,
      description: 'The color used for warning messages.',
    },
    dangerColor: {
      type: 'string',
      pattern: hexColor.source,
      default: baseTheme.dangerColor,
      description: 'The color used for error messages.',
    },
    tileLayer: {
      type: 'string',
      format: 'uri',
      default: baseTheme.tileLayer,
      description: 'The tileLayer to use for Leaflet maps.',
    },
    font: {
      description: 'The font to use in the app.',
      anyOf: [
        { $ref: '#/components/schemas/CustomFontDefinition' },
        { $ref: '#/components/schemas/GoogleFontDefinition' },
      ],
    },
  },
};
