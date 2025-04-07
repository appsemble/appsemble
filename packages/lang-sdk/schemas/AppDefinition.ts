import { defaultLocale } from '@appsemble/utils';
import { type OpenAPIV3 } from 'openapi-types';

export const AppDefinition: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  required: ['name', 'defaultPage', 'pages'],
  additionalProperties: false,
  description: 'An app definition describes what an Appsemble app looks like.',
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
    layout: {
      $ref: '#/components/schemas/AppLayoutDefinition',
      description: 'Properties related to the layout of the app.',
    },
    notifications: {
      enum: ['login', 'opt-in', 'startup'],
      description: `The strategy to use for apps to subscribe to push notifications.

If specified, push notifications can be sent to subscribed users via the _Notifications_ tab in the
app details page in Appsemble Studio. Setting this to \`opt-in\` allows for users to opt into
receiving push notifications by pressing the subscribe button in the App settings page. Setting this
to \`startup\` will cause Appsemble to immediately request for the permission upon opening the app.
If this is set to \`login\`, the app will request permissions for push notification once the user
logs in.

> **Note**: Setting \`notifications\` to \`startup\` is not recommended, due to its invasive nature.
`,
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
    controller: {
      $ref: '#/components/schemas/ControllerDefinition',
    },
    members: {
      $ref: '#/components/schemas/AppMembersDefinition',
    },
    resources: {
      type: 'object',
      description: `Resources define how Appsemble can store data for an app.

The most basic resource has a \`schema\` property and defines the minimal security rules.
`,
      additionalProperties: {
        description: 'A single resource definition.',
        $ref: '#/components/schemas/ResourceDefinition',
      },
    },
    security: {
      $ref: '#/components/schemas/SecurityDefinition',
      description: 'Role and guest definitions that may be used by the app.',
    },
    pages: {
      type: 'array',
      minItems: 1,
      description: 'The pages of the app.',
      items: {
        anyOf: [
          { $ref: '#/components/schemas/PageDefinition' },
          { $ref: '#/components/schemas/TabsPageDefinition' },
          { $ref: '#/components/schemas/FlowPageDefinition' },
          { $ref: '#/components/schemas/LoopPageDefinition' },
          { $ref: '#/components/schemas/ContainerPageDefinition' },
        ],
      },
    },
    theme: {
      $ref: '#/components/schemas/Theme',
    },
    cron: {
      type: 'object',
      minProperties: 1,
      description: 'A list of cron jobs that are associated with this app.',
      additionalProperties: { $ref: '#/components/schemas/CronDefinition' },
    },
    webhooks: {
      type: 'object',
      minProperties: 1,
      description: 'A list of callable webhooks that are associated with this app.',
      additionalProperties: { $ref: '#/components/schemas/WebhookDefinition' },
    },
    anchors: {
      type: 'array',
      minItems: 1,
      description: 'Helper property that can be used to store YAML anchors.',
      items: {},
    },
    containers: {
      type: 'array',
      minItems: 1,
      additionalProperties: false,
      description: 'Definition of the companion containers to be created.',
      items: { $ref: '#/components/schemas/ContainerDefinition' },
    },
    registry: {
      type: 'string',
      default: null,
      description: 'The default registry used to pull images for companion containers.',
    },
  },
};
