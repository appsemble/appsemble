import { OpenAPIV3 } from 'openapi-types';

export const BasePageDefinition: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  additionalProperties: true,
  properties: {
    name: {
      type: 'string',
      maxLength: 50,
      description: `The name of an app.

This will be displayed on the top of the page and in the side menu.
`,
    },
    navTitle: {
      $ref: '#/components/schemas/RemapperDefinition',
      description: `The name of the page when displayed in the navigation menu.

Context property \`name\` can be used to access the name of the page.
`,
    },
    icon: {
      type: 'string',
      description: `An optional icon from the fontawesome icon set

This will be displayed in the navigation menu.
`,
    },
    parameters: {
      type: 'array',
      description:
        'Page parameters can be used for linking to a page that should display a single resource.',
      items: {
        type: 'string',
        minLength: 1,
        maxLength: 30,
      },
    },
    roles: {
      type: 'array',
      description: `The list of roles that are allowed to view this page.

If a user does not have the right role, they are redirected to \`defaultPage\`.
`,
      items: {
        type: 'string',
      },
    },
    theme: {
      $ref: '#/components/schemas/Theme',
    },
    navigation: {
      $ref: '#/components/schemas/AppLayoutDefinition/properties/navigation',
    },
    hideFromMenu: {
      type: 'boolean',
      description: 'Whether or not the page should be displayed in navigational menus.',
      default: false,
    },
  },
};
