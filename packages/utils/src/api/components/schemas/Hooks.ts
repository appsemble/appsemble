import { OpenAPIV3 } from 'openapi-types';

export const Hooks: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'Hooks that are triggered upon calling a resource action.',
  properties: {
    notification: {
      type: 'object',
      description: 'The strategy used to notify users.',
      properties: {
        to: {
          type: 'array',
          description: `The list of roles to notify.

          Aside from roles, ‘$author’ can also be used to notify the author of the resource.`,
          minItems: 1,
          items: {
            type: 'string',
          },
        },
        subscribe: {
          type: 'string',
          description: `If set, allows users to manually subscribe for notifications for this resource regardless of roles.

          The following values are allowed:
          - \`all\`: Allows users to be notified about actions on all of the resources of this type.
          - \`single\`: Allows users to be notified about actions a single instance of a resource of this type.
          - \`both\`: Allows users to be notified about all resources or a single resource of this type.`,
          enum: ['all', 'single', 'both'],
        },
        data: {
          type: 'object',
          description: 'The data used to display the content of the notification.',
          additionalProperties: true,
          properties: {
            // XXX: title and content are remapper properties,
            // which currently can’t be defined correctly.
            // title: {
            //   description: 'The title of the notification.',
            // },
            // content: {
            //   description: 'The body of the notification.',
            // },
            link: {
              type: 'string',
              description: `The URL of the page the user gets redirected to after being clicked.

              If the URL is relative, it will be relative to the app.`,
            },
          },
        },
      },
    },
  },
};
