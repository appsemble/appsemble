export default {
  type: 'object',
  description: 'This describes what a page will look like in the app.',
  if: {
    properties: {
      type: 'flow',
    },
  },
  then: {
    required: ['name', 'flowPages'],
  },
  else: {
    required: ['name', 'blocks'],
  },
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
      enum: ['flow', 'page'],
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
    flowPages: {
      type: 'array',
      minItems: 1,
      description: "Sub pages belonging to this page's flow.",
      items: {
        $ref: '#/components/schemas/FlowPage',
      },
    },
  },
};
