import { type OpenAPIV3 } from 'openapi-types';

export const NotificationHookDataDefinition: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'The data used to display the content of the notification.',
  additionalProperties: true,
  minProperties: 1,
  properties: {
    title: {
      $ref: '#/components/schemas/RemapperDefinition',
      description: 'The title of the notification.',
    },
    content: {
      $ref: '#/components/schemas/RemapperDefinition',
      description: 'The body of the notification.',
    },
    link: {
      $ref: '#/components/schemas/RemapperDefinition',
      description: `The URL of the page the user gets redirected to after being clicked.

If the URL is relative, it will be relative to the app.
`,
    },
  },
};
