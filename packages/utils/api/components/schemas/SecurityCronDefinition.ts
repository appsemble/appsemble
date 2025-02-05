import { type OpenAPIV3 } from 'openapi-types';

export const SecurityCronDefinition: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'This describes the permissions that unauthenticated users have.',
  additionalProperties: false,
  properties: {
    inherits: {
      type: 'array',
      minItems: 1,
      description: `The name of the role to inherit from.

Note that this role must exist.
`,
      items: {
        type: 'string',
      },
    },
    permissions: {
      type: 'array',
      description: 'Specific permissions within the app, which unauthenticated users should have',
      items: {
        type: 'string',
      },
    },
  },
};
