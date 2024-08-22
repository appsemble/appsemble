import { type OpenAPIV3 } from 'openapi-types';

export const SecurityRoleDefinition: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'This describes a security role.',
  additionalProperties: false,
  properties: {
    description: {
      type: 'string',
      description: 'The description of the role.',
    },
    defaultPage: {
      type: 'string',
      description: 'The default page to redirect users with this role to.',
    },
    inherits: {
      type: 'array',
      minItems: 1,
      description: `The name of the role to inherit from.

Note that this role must exist and can not inherit itself via this field or the \`inherits\` field
of the referenced role.
`,
      items: {
        type: 'string',
      },
    },
    permissions: {
      type: 'array',
      description: 'Specific permissions within the app, which this role should have',
      items: {
        type: 'string',
      },
    },
  },
};
