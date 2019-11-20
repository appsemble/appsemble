import { normalized } from '@appsemble/utils';

export default {
  type: 'object',
  description: 'An app recipe defines what an app will look like.',
  properties: {
    id: {
      type: 'number',
      minimum: 0,
      readOnly: true,
      description: `The unique identifier for the app.

        This value will be generated automatically by the API.
      `,
    },
    OrganizationId: {
      $ref: '#/components/schemas/Organization/properties/id',
    },
    path: {
      type: 'string',
      minLength: 1,
      maxLength: 30,
      pattern: normalized,
      description: `The URL path segment on which this app is reachable.

        This may only contain lower case characters, numbers, and hyphens. By default this is a
        normalized version of the app name.
      `,
    },
    domain: {
      oneOf: [
        { type: 'string', maxLength: 0 },
        { type: 'string', format: 'hostname' },
      ],
      description: `The domain name on which this app should be served.

        If this is unspecified, the app will be served from the path on the domain of the server
        \`HOSTNAME\` variable.
      `,
    },
    private: {
      type: 'boolean',
      description: 'Determines whether this app should be included when fetching all apps.',
    },
    template: {
      type: 'boolean',
      description: 'Determines whether this app should be included when fetching for templates.',
    },
    definition: {
      type: 'object',
      required: ['name', 'defaultPage', 'pages'],
      properties: {
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
        navigation: {
          enum: ['bottom', 'left-menu', 'hidden'],
          description: `The navigation type to use.

            If this is omitted, a collapsable side navigation menu will be rendered on the left.
          `,
        },
        notifications: {
          enum: ['opt-in', 'startup'],
          type: 'string',
          description: 'The strategy to use for apps to subscribe to push notifications.',
        },
        defaultPage: {
          $ref: '#/components/schemas/Page/oneOf/1/properties/name',
          description: `The name of the page that should be displayed when the app is initially loaded.

            This **must** match the name of a page defined for the app.
          `,
        },
        resources: {
          $ref: '#/components/schemas/ResourceDefinition',
          description: 'Resource definitions that may be used by the app.',
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
              clientId: {
                type: 'string',
              },
              scope: {
                type: 'string',
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
        theme: {
          $ref: '#/components/schemas/Theme',
        },
      },
    },
  },
};
