import { OpenAPIV3 } from 'openapi-types';

import { baseTheme, hexColor } from '../../../constants';

export const Theme: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'A generic theme definition.',
  additionalProperties: false,
  default: baseTheme,
  properties: {
    themeColor: {
      type: 'string',
      pattern: hexColor.source,
      description: `The generic theme color of the app.

This is used for example in the URL bar on Android.
`,
    },
    splashColor: {
      type: 'string',
      pattern: hexColor.source,
      description: `The background color of the PWA splash screen.

This defaults to the theme color.
`,
    },
    primaryColor: {
      type: 'string',
      pattern: hexColor.source,
      description: `The primary color used within the app.

This is used in various elements like the navbar.
`,
    },
    linkColor: {
      type: 'string',
      pattern: hexColor.source,
      description: 'The color used for links.',
    },
    infoColor: {
      type: 'string',
      pattern: hexColor.source,
      description: 'The color used for informational messages.',
    },
    successColor: {
      type: 'string',
      pattern: hexColor.source,
      description: 'The color used for successful actions.',
    },
    warningColor: {
      type: 'string',
      pattern: hexColor.source,
      description: 'The color used for warning messages.',
    },
    dangerColor: {
      type: 'string',
      pattern: hexColor.source,
      description: 'The color used for error messages.',
    },
    tileLayer: {
      type: 'string',
      format: 'uri',
      description: 'The tileLayer to use for Leaflet maps.',
    },
  },
};
