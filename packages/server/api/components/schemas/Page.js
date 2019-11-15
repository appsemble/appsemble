export default {
  oneOf: [
    {
      type: 'object',
      description: 'This describes what a page will look like in the app.',
      required: ['name', 'blocks'],
      properties: {
        name: {
          type: 'string',
          maxLength: 50,
          description: `The name of an app.

          This will be displayed on the top of the page and in the side menu.
        `,
        },
        type: {
          type: 'string',
          enum: ['flow', 'page', 'tabs'],
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
        scope: {
          type: 'array',
          description: `Specify which authentication scopes are needed to view this page.

          If a user either isn’t logged in, or doesn’t have sufficient permissions to view the page,
          they will be prompted with a login screen.
        `,
          items: {
            enum: ['*'],
          },
        },
        theme: {
          $ref: '#/components/schemas/Theme',
        },
        blocks: {
          type: 'array',
          minItems: 1,
          description: 'The blocks that make up a page.',
          items: {
            $ref: '#/components/schemas/Block',
          },
        },
        subPages: {
          type: 'array',
          minItems: 1,
          description: "Sub pages belonging to this page's flow.",
          items: {
            $ref: '#/components/schemas/SubPage',
          },
        },
        actions: {
          type: 'object',
          description: 'A mapping of actions that can be fired by the page to action handlers.',
          additionalProperties: {
            type: 'object',
          },
        },
        navigation: {
          $ref: '#/components/schemas/App/properties/definition/properties/navigation',
        },
        hideFromMenu: {
          type: 'boolean',
          description: 'Whether or not the page should be displayed in navigational menus.',
          default: false,
        },
      },
    },
    {
      type: 'object',
      description: 'This describes what a page will look like in the app.',
      required: ['name', 'subPages'],
      properties: {
        name: {
          type: 'string',
          maxLength: 50,
          description: `The name of an app.

          This will be displayed on the top of the page and in the side menu.
        `,
        },
        type: {
          type: 'string',
          enum: ['flow', 'page', 'tabs'],
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
        scope: {
          type: 'array',
          description: `Specify which authentication scopes are needed to view this page.

          If a user either isn’t logged in, or doesn’t have sufficient permissions to view the page,
          they will be prompted with a login screen.
        `,
          items: {
            enum: ['*'],
          },
        },
        theme: {
          $ref: '#/components/schemas/Theme',
        },
        subPages: {
          type: 'array',
          minItems: 1,
          description: "Sub pages belonging to this page's flow.",
          items: {
            $ref: '#/components/schemas/SubPage',
          },
        },
        actions: {
          type: 'object',
          description: 'A mapping of actions that can be fired by the page to action handlers.',
          additionalProperties: {
            type: 'object',
          },
        },
        navigation: {
          $ref: '#/components/schemas/App/properties/definition/properties/navigation',
        },
        hideFromMenu: {
          type: 'boolean',
          description: 'Whether or not the page should be displayed in navigational menus.',
          default: false,
        },
      },
    },
  ],
};
