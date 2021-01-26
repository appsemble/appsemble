import { OpenAPIV3 } from 'openapi-types';

import { normalized } from '../../../constants';

export const App: OpenAPIV3.NonArraySchemaObject = {
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
      pattern: normalized.source,
      description: `The URL path segment on which this app is reachable.

        This may only contain lower case characters, numbers, and hyphens. By default this is a
        normalized version of the app name.
      `,
    },
    domain: {
      type: 'string',
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
    longDescription: {
      type: 'string',
      description: `
A long description for the app.

The long desciption will be rendered on the app details page. Markdown content is supported.
`,
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
        roles: {
          type: 'array',
          description: `The list of roles that are allowed to view this app.

            This determines the default roles required for resource actions as well as pages, unless otherwise specified.`,
          items: {
            type: 'string',
          },
        },
        description: {
          type: 'string',
          maxLength: 80,
          description: `A short description describing the app.

            This will be displayed on the app store.
          `,
        },
        login: {
          type: 'string',
          enum: ['navigation', 'menu', 'hidden'],
          description: 'Where the login and logout buttons should be located.',
        },
        layout: {
          type: 'object',
          properties: {
            login: {
              type: 'string',
              enum: ['navbar', 'navigation', 'hidden'],
              description: 'The location of the login button.',
            },
            settings: {
              type: 'string',
              enum: ['navbar', 'navigation', 'hidden'],
              description: `
                The location of the settings button.

                If set to \`navigation\`, it will only be visible if \`login\` is also visible in
                \`navigation\`.
              `,
            },
            feedback: {
              type: 'string',
              enum: ['navbar', 'navigation', 'hidden'],
              description: `
                The location of the feedback button.

                If set to \`navigation\`, it will only be visible if \`login\` is also visible in
                \`navigation\`.
              `,
            },
            navigation: {
              type: 'string',
              enum: ['bottom', 'left-menu', 'hidden'],
              description: `
                The navigation type to use.

                If this is omitted, a collapsable side navigation menu will be rendered on the left.
              `,
            },
          },
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
        defaultLanguage: {
          type: 'string',
          default: 'en-US',
          minLength: 2,
          description: 'The default language for the app.',
        },
        resources: {
          $ref: '#/components/schemas/ResourceDefinition',
          description: 'Resource definitions that may be used by the app.',
        },
        security: {
          $ref: '#/components/schemas/Security',
          description: 'Role definitions that may be used by the app.',
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
        cron: {
          type: 'object',
          description: 'A list of cron jobs that are associated with this app.',
          additionalProperties: { $ref: '#/components/schemas/CronDefinition' },
        },
        anchors: {
          type: 'array',
          minItems: 1,
          description: 'Helper property that can be used to store YAML anchors.',
          items: {},
        },
      },
    },
    screenshotUrls: {
      type: 'array',
      description: 'A list of URLs referencing app screenshots',
      items: { type: 'string' },
    },
  },
};
