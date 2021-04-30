import { OpenAPIV3 } from 'openapi-types';

import { defaultLocale } from '../../../constants';

export const AppDefinition: OpenAPIV3.NonArraySchemaObject = {
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

This determines the default roles required for resource actions as well as pages, unless otherwise specified.
`,
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
    layout: { $ref: '#/components/schemas/AppLayoutDefinition' },
    notifications: {
      enum: ['opt-in', 'startup'],
      type: 'string',
      description: 'The strategy to use for apps to subscribe to push notifications.',
    },
    defaultPage: {
      type: 'string',
      description: `The name of the page that should be displayed when the app is initially loaded.

This **must** match the name of a page defined for the app.
`,
    },
    defaultLanguage: {
      type: 'string',
      default: defaultLocale,
      minLength: 2,
      description: 'The default language for the app.',
    },
    resources: {
      $ref: '#/components/schemas/ResourceDefinition',
      description: 'Resource definitions that may be used by the app.',
    },
    security: {
      $ref: '#/components/schemas/SecurityDefinition',
      description: 'Role definitions that may be used by the app.',
    },
    pages: {
      type: 'array',
      minItems: 1,
      description: 'The pages of the app.',
      items: {
        oneOf: [
          { $ref: '#/components/schemas/PageDefinition' },
          // { $ref: '#/components/schemas/TabsPageDefinition' },
          // { $ref: '#/components/schemas/FlowPageDefinition' },
        ],
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
};
