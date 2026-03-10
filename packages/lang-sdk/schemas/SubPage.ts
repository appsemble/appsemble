import { type OpenAPIV3 } from 'openapi-types';

export const SubPage: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'This describes what a sub page will look like in the app.',
  required: ['blocks'],
  additionalProperties: false,
  properties: {
    name: {
      $ref: '#/components/schemas/RemapperDefinition',
      description: 'The name of the sub page.',
    },
    layout: {
      $ref: '#/components/schemas/PageLayoutDefinition',
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
    blocks: {
      type: 'array',
      minItems: 1,
      description: 'The blocks that make up a page.',
      items: {
        $ref: '#/components/schemas/BlockDefinition',
      },
    },
  },
};
