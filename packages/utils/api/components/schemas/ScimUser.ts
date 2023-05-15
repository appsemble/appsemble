import { type OpenAPIV3 } from 'openapi-types';

export const ScimUser: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  additionalProperties: true,
  description: 'The definition of a user according to the SCIM documentation.',
  required: ['emails', 'schemas', 'userName'],
  properties: {
    schemas: {
      type: 'array',
      items: { type: 'string' },
    },
    userName: {
      type: 'string',
      description:
        'A unique identifier for the user (generally maps to the Azure AD user principal name)',
    },
    active: {
      type: 'boolean',
    },
    meta: {
      type: 'object',
      additionalProperties: false,
      description: 'Read-only metadata maintained by the service provider',
      properties: {
        resourceType: {
          type: 'string',
        },
        created: {
          type: 'string',
        },
        lastModified: {
          type: 'string',
        },
        location: {
          type: 'string',
        },
      },
    },
    emails: {
      type: 'array',
      minLength: 1,
      items: {
        type: 'object',
        additionalProperties: false,
        description:
          "A user's email. By default, one of these should be of type 'work' and have 'primary' set to true. Value contains actual address",
        required: ['primary', 'type', 'value'],
        properties: {
          primary: {
            type: 'boolean',
          },
          type: {
            type: 'string',
          },
          value: {
            type: 'string',
          },
        },
      },
    },
  },
};
