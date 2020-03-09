export default {
  type: 'object',
  description: 'A generic theme definition.',
  additionalProperties: false,
  properties: {
    themeColor: {
      $ref: '#/components/schemas/Color',
      default: '#ffffff',
      description: `The generic theme color of the app.

        This is used for example in the URL bar on Android.
      `,
    },
    splashColor: {
      $ref: '#/components/schemas/Color',
      description: `The background color of the PWA splash screen.

        This defaults to the theme color.
      `,
    },
    primaryColor: {
      $ref: '#/components/schemas/Color',
      default: '#5191ff',
      description: `The primary color used within the app.
      
      This is used in various elements like the navbar.`,
    },
    linkColor: {
      $ref: '#/components/schemas/Color',
      description: 'The color used for links.',
    },
    infoColor: {
      $ref: '#/components/schemas/Color',
      description: 'The color used for informational messages.',
    },
    successColor: {
      $ref: '#/components/schemas/Color',
      description: 'The color used for successful actions.',
    },
    warningColor: {
      $ref: '#/components/schemas/Color',
      description: 'The color used for warning messages.',
    },
    dangerColor: {
      $ref: '#/components/schemas/Color',
      description: 'The color used for error messages.',
    },
    tileLayer: {
      type: 'string',
      format: 'uri',
      description: 'The tileLayer to use for Leaflet maps.',
    },
  },
};
