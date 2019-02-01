export default {
  type: 'object',
  description: 'An app recipe defines what an app will look like.',
  required: ['name', 'defaultPage', 'pages'],
  properties: {
    theme: {
      $ref: '#/components/schemas/Theme',
    },
    id: {
      type: 'number',
      minimum: 0,
      readOnly: true,
      description: `The unique identifier for the app.

        This value will be generated automatically by the API.
      `,
    },
    name: {
      type: 'string',
      minLength: 1,
      maxLength: 30,
      description: `The human readable name of the app.

        This will be displayed for example on the home screen or in the browser tab.
      `,
    },
    description: {
      type: 'string',
      maxLength: 80,
      description: `A short description describing the app.

        This will be displayed on the app store.
      `,
    },
    path: {
      type: 'string',
      minLength: 1,
      maxLength: 30,
      pattern: /^[a-z\d-]+$/,
      description: `The URL path segment on which this app is reachable.

        This may only contain lower case characters, numbers, and hyphens. By default this is a
        normalized version of the app name.
      `,
    },
    defaultPage: {
      $ref: '#/components/schemas/Page/properties/name',
      description: `The name of the page that should be displayed when the app is initially loaded.

        This **must** match the name of a page defined for the app.
      `,
    },
    definitions: {
      type: 'object',
      description: `JSON schema definitions that may be used by the app.

        **note**: This is under consideration for deprecation.
      `,
    },
    authentication: {
      type: 'array',
      description: 'A list of login methods for the app.',
      items: {
        type: 'object',
        required: ['method', 'url'],
        properties: {
          method: {
            enum: ['email'],
          },
          url: {
            type: 'string',
            format: 'uri',
          },
          refreshURL: {
            type: 'string',
            format: 'uri',
          },
        },
      },
    },
    pages: {
      type: 'array',
      minItems: 1,
      description: 'The pages of the app.',
      items: {
        $ref: '#/components/schemas/Page',
      },
    },
  },
};
