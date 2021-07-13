import { OpenAPIV3 } from 'openapi-types';

export const AppLayoutDefinition: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  properties: {
    login: {
      type: 'string',
      enum: ['navbar', 'navigation', 'hidden'],
      default: 'navbar',
      description: 'The location of the login button.',
    },
    settings: {
      type: 'string',
      enum: ['navbar', 'navigation', 'hidden'],
      default: 'navbar',
      description: `The location of the settings button.

If set to \`navigation\`, it will only be visible if \`login\` is also visible in \`navigation\`.
`,
    },
    feedback: {
      type: 'string',
      enum: ['navbar', 'navigation', 'hidden'],
      default: 'navigation',
      description: `The location of the feedback button.

If set to \`navigation\`, it will only be visible if \`login\` is also visible in \`navigation\`.
`,
    },
    navigation: {
      type: 'string',
      enum: ['bottom', 'left-menu', 'hidden'],
      default: 'left-menu',
      description: `The navigation type to use.

If this is omitted, a collapsable side navigation menu will be rendered on the left.
`,
    },
  },
};
