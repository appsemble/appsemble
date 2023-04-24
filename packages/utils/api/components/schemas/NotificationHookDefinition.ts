import { type OpenAPIV3 } from 'openapi-types';

export const NotificationHookDefinition: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'The strategy used to notify users.',
  additionalProperties: false,
  minProperties: 1,
  properties: {
    to: {
      type: 'array',
      description: `The list of roles to notify.

Aside from roles, \`$author\` can also be used to notify the author of the resource.
`,
      minItems: 1,
      items: {
        type: 'string',
      },
    },
    subscribe: {
      description: `If set, allows users to manually subscribe for notifications for this resource regardless of roles.

The following values are allowed:
- \`all\`: Allows users to be notified about actions on all of the resources of this type.
- \`single\`: Allows users to be notified about actions a single instance of a resource of this
  type.
- \`both\`: Allows users to be notified about all resources or a single resource of this type.
`,
      enum: ['all', 'single', 'both'],
    },
    data: { $ref: '#/components/schemas/NotificationHookDataDefinition' },
  },
};
