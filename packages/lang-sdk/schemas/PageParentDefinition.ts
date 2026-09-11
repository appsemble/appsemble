import { type OpenAPIV3 } from 'openapi-types';

export const PageParentDefinition: OpenAPIV3.SchemaObject = {
  description: `A candidate parent page, optionally scoped to a set of roles.

A plain string names the parent page. An object scopes that parent to the roles that may use it.
`,
  anyOf: [
    {
      type: 'string',
      maxLength: 50,
      description: 'The name of the parent page.',
    },
    {
      type: 'object',
      additionalProperties: false,
      required: ['page'],
      properties: {
        page: {
          type: 'string',
          maxLength: 50,
          description: 'The name of the parent page.',
        },
        roles: {
          type: 'array',
          minItems: 1,
          items: { type: 'string' },
          description: `The roles this parent applies to.

When omitted, the parent applies to every app member.
`,
        },
      },
    },
  ],
};
