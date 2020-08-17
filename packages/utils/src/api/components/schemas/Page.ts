import type { OpenAPIV3 } from 'openapi-types';

const sharedProperties: {
  [property: string]: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject;
} = {
  name: {
    type: 'string',
    maxLength: 50,
    description: `The name of an app.

    This will be displayed on the top of the page and in the side menu.
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

    If a user does not have the right role, they are redirected to \`defaultPage\`.`,
    items: {
      type: 'string',
    },
  },
  theme: {
    $ref: '#/components/schemas/Theme',
  },
  navigation: {
    $ref: '#/components/schemas/App/properties/definition/properties/navigation',
  },
  hideFromMenu: {
    type: 'boolean',
    description: 'Whether or not the page should be displayed in navigational menus.',
    default: false,
  },
};

export const Page: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  oneOf: [
    {
      type: 'object',
      description: 'This describes what a page will look like in the app.',
      required: ['name', 'blocks'],
      properties: {
        ...sharedProperties,
        type: {
          type: 'string',
          enum: ['page'],
        },
        blocks: {
          type: 'array',
          minItems: 1,
          description: 'The blocks that make up a page.',
          items: {
            $ref: '#/components/schemas/Block',
          },
        },
      },
    },
    {
      type: 'object',
      description: 'This describes what a page will look like in the app.',
      required: ['name', 'type', 'subPages'],
      properties: {
        ...sharedProperties,
        type: {
          type: 'string',
          enum: ['flow', 'tabs'],
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
      },
    },
  ],
};
