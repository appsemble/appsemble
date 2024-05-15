import { type OpenAPIV3 } from 'openapi-types';

export const BasePageDefinition: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  additionalProperties: false,
  required: ['name'],
  properties: {
    name: {
      type: 'string',
      maxLength: 50,
      description: `The name of an app.

This field is always required and must be unique within the app, meaning that it is not possible to
have two pages with the same name. The name of the page is displayed at the *app bar* of each page as well as in the side navigational menu.

> **Note**: The URL used to navigate to pages is determined by this property.
`,
    },
    hideName: {
      type: 'boolean',
      description: 'Whether or not the page name should be displayed in the *app bar*.',
    },
    navTitle: {
      $ref: '#/components/schemas/RemapperDefinition',
      description: `The name of the page when displayed in the navigation menu.

  Context property \`name\` can be used to access the name of the page.
  `,
    },
    hideNavTitle: {
      type: 'boolean',
      description: `Whether or not the page should be displayed in navigational menus.

  By default all pages without parameters are added to navigational menus. Set to \`true\` to hide the
  page from menus.
  `,
      default: false,
    },
    navigation: {
      $ref: '#/components/schemas/AppLayoutDefinition/properties/navigation',
      description: `The type of navigation displayed on the page.

This overrides the navigation property of the app itself. Defaults to \`left-menu\` if navigation or
App navigation are not set.

Set to \`bottom\` to use a navigation pane at the bottom of the screen instead of the default side
menu. Set to \`hidden\` to display no navigational menus at all.
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
      description: `Page parameters can be used for linking to a page that should display a single resource.

This defined as a list of strings representing the properties to pass through. More often than not
passing \`id\` through is sufficient, depending on the block.
`,
      items: {
        type: 'string',
        minLength: 1,
        maxLength: 30,
      },
    },
    roles: {
      type: 'array',
      description: `The list of roles that are allowed to view this page.

If the user doesn’t have any of the roles in the list the page will be unavailable to them. An empty
list can be used to specify that users need to log in but do not need a specific role.

Users trying to visit a page without having the correct roles will be redirected to the first page
that they are allowed to view. If there aren’t any accessible pages, the user will be logged out and
instructed to contact the app owner to get permissions.
`,
      items: {
        type: 'string',
      },
    },
    theme: {
      $ref: '#/components/schemas/Theme',
    },
    badgeCount: {
      $ref: '#/components/schemas/RemapperDefinition',
      description: 'A Remapper that resolves to a number to be visibile in the side-menu.',
    },
  },
};
