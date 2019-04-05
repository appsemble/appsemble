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
  },
};
