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
    install: {
      enum: ['navbar', 'navigation', 'hidden'],
      default: 'navigation',
      description: `The location of the install button.

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
  },
};
