import { type OpenAPIV3 } from 'openapi-types';

import { baseTheme } from '../constants/baseTheme.js';
import { hexColor, normalized, themeVariableValue } from '../constants/patterns.js';

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
      description: `The body font of the app.

This is the font used for regular text.
`,
      anyOf: [
        { $ref: '#/components/schemas/CustomFontDefinition' },
        { $ref: '#/components/schemas/GoogleFontDefinition' },
      ],
    },
    displayFont: {
      description: `The display font of the app.

A second font family the app loads, exposed as the \`--font-family-display\` custom property for
the CSS of the app and its blocks. It falls back to the body font.
`,
      anyOf: [
        { $ref: '#/components/schemas/CustomFontDefinition' },
        { $ref: '#/components/schemas/GoogleFontDefinition' },
      ],
    },
    variables: {
      type: 'object',
      description: `Custom CSS properties (design tokens) exposed on \`:root\` in the theme CSS.

Each entry is emitted as a \`--<name>\` custom property. Names must be lower case and hyphen
separated. Custom properties inherit into every block's shadow DOM, so tokens defined once are
usable in core, shared, and block styles.

For example:

\`\`\`yaml
theme:
  variables:
    night: '#0e1220'
    font-display: "'Baloo 2', sans-serif"
\`\`\`

These can be referenced in custom CSS as \`var(--night)\` and \`var(--font-display)\`.
`,
      minProperties: 1,
      maxProperties: 32,
      // The validator supports propertyNames, but the OpenAPI schema object type does not know it.
      propertyNames: {
        pattern: normalized.source,
        maxLength: 40,
      },
      additionalProperties: {
        type: 'string',
        pattern: themeVariableValue.source,
        maxLength: 128,
      },
    } as OpenAPIV3.NonArraySchemaObject,
  },
};
