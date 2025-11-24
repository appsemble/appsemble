import { type OpenAPIV3 } from 'openapi-types';

export const AppLayoutDefinition: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'The layout definition allows you to tweak several layout elements of the app.',
  additionalProperties: false,
  minProperties: 1,
  properties: {
    login: {
      enum: ['navbar', 'navigation', 'hidden'],
      default: 'navbar',
      description: 'The location of the login button.',
    },
    settings: {
      enum: ['navbar', 'navigation', 'hidden'],
      default: 'navbar',
      description: `The location of the settings button.

If set to \`navigation\`, it will only be visible if \`login\` is also visible in \`navigation\`.
`,
    },
    feedback: {
      enum: ['navbar', 'navigation', 'hidden'],
      default: 'navigation',
      description: `The location of the feedback button.

If set to \`navigation\`, it will only be visible if \`login\` is also visible in \`navigation\`.
`,
    },
    enabledSettings: {
      type: 'array',
      items: {
        enum: ['email', 'name', 'phoneNumber', 'picture', 'languages', 'password'],
      },
      description: 'A list of the settings to display on the settings page.',
    },
    install: {
      enum: ['navbar', 'navigation', 'hidden'],
      default: 'navigation',
      description: `The location of the install button.

If set to \`navigation\`, it will only be visible if \`login\` is also visible in \`navigation\`.
`,
    },
    debug: {
      enum: ['navbar', 'navigation', 'hidden'],
      default: 'hidden',
      description: `The location of the debug button.

If set to \`navigation\`, it will only be visible if \`login\` is also visible in \`navigation\`.
`,
    },
    navigation: {
      enum: ['bottom', 'left-menu', 'hidden'],
      default: 'left-menu',
      description: `The navigation type to use.

If this is omitted, a collapsable side navigation menu will be rendered on the left.
`,
    },
    logo: {
      type: 'object',
      description: 'The settings of the app logo.',
      additionalProperties: false,
      properties: {
        position: {
          enum: ['navbar', 'hidden'],
          default: 'hidden',
          description: 'The location of the app logo.',
        },
        asset: { type: 'string' },
      },
    },
    headerTag: {
      type: 'object',
      description: 'Header text to be shown in a tag next to the page name',
      additionalProperties: false,
      properties: {
        text: {
          description: 'Text to be shown inside the tag',
          $ref: '#/components/schemas/RemapperDefinition',
        },
        hide: {
          description: 'Whether to hide the tag',
          $ref: '#/components/schemas/RemapperDefinition',
        },
      },
    },
    titleBarText: {
      description:
        'Whether to display app name or the page name in the title bar, displays pageName by default',
      type: 'string',
      enum: ['appName', 'pageName'],
    },
  },
};
