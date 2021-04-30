import { OpenAPIV3 } from 'openapi-types';

const roles: OpenAPIV3.ArraySchemaObject = {
  type: 'array',
  description: `The list of roles that are allowed to use this action.

This will override the default roles that are assigned.
`,
  items: {
    type: 'string',
  },
};

const query: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'The query parameters to use in the request.',
  additionalProperties: { type: 'string' },
};

const referenceAction: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  properties: {
    trigger: {
      type: 'array',
      items: { type: 'string', enum: ['create', 'update', 'delete'] },
      minItems: 1,
      uniqueItems: true,
    },
  },
};

export const ResourceDefinition: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  additionalProperties: {
    type: 'object',
    properties: {
      expires: {
        type: 'string',
        description: `A time string representing when a resource should expire.

        Example: 1d 8h 30m
        `,
        pattern:
          /^(\d+(y|yr|years))?\s*(\d+months)?\s*(\d+(w|wk|weeks))?\s*(\d+(d|days))?\s*(\d+(h|hr|hours))?\s*(\d+(m|min|minutes))?\s*(\d+(s|sec|seconds))?$/
            .source,
      },
      schema: {
        type: 'object',
        additionalProperties: true,
        description: 'JSON schema definitions that may be used by the app.',
      },
      references: {
        type: 'object',
        description: `
          References to other resources.

          The key if the property that references the other resource.
          The value is an object describing the name of the resource and how it should behave.
        `,
        additionalProperties: {
          type: 'object',
          properties: {
            resource: { type: 'string' },
            create: referenceAction,
            update: referenceAction,
            delete: referenceAction,
          },
        },
      },
      roles: {
        type: 'array',
        description: 'The default roles that are allowed to perform all actions.',
        items: { type: 'string' },
      },
      url: {
        type: 'string',
        default: '/api/apps/{appId}/{resource}',
        description: 'URL to use if not otherwise specified.',
      },
      id: {
        type: 'string',
        default: 'id',
        description: 'Name of the field used when accessing singular entities.',
      },
      query: {
        type: 'object',
        description: "Overrides for 'query' requests.",
        properties: {
          roles,
          query,
          method: {
            type: 'string',
            default: 'GET',
            description: 'HTTP method to use for this type of request.',
          },
          url: {
            type: 'string',
            default: '/api/apps/{appId}/{resource}',
            description: 'URL to use for this type of request.',
          },
        },
      },
      get: {
        type: 'object',
        description: "Overrides for 'get' requests.",
        properties: {
          roles,
          query,
          method: {
            type: 'string',
            default: 'GET',
            description: 'HTTP method to use for this type of request.',
          },
          url: {
            type: 'string',
            default: '/api/apps/{appId}/{resource}/{id}',
            description: 'URL to use for this type of request.',
          },
        },
      },
      count: {
        type: 'object',
        description: "Overrides for 'count' requests.",
        properties: {
          roles,
          query,
          method: {
            type: 'string',
            default: 'GET',
            description: 'HTTP method to use for this type of request.',
          },
          url: {
            type: 'string',
            default: '/api/apps/{appId}/{resource}/$count',
            description: 'URL to use for this type of request.',
          },
        },
      },
      create: {
        type: 'object',
        description: "Overrides for 'create' requests.",
        properties: {
          roles,
          query,
          method: {
            type: 'string',
            default: 'POST',
            description: 'HTTP method to use for this type of request.',
          },
          url: {
            type: 'string',
            default: '/api/apps/{appId}/{resource}/{id}',
            description: 'URL to use for this type of request.',
          },
          hooks: {
            $ref: '#/components/schemas/ResourceHooksDefinition',
          },
        },
      },
      update: {
        type: 'object',
        description: "Overrides for 'update' requests.",
        properties: {
          roles,
          query,
          method: {
            type: 'string',
            default: 'PUT',
            description: 'HTTP method to use for this type of request.',
          },
          url: {
            type: 'string',
            default: '/api/apps/{appId}/{resource}/{id}',
            description: 'URL to use for this type of request.',
          },
          hooks: {
            $ref: '#/components/schemas/ResourceHooksDefinition',
          },
        },
      },
      delete: {
        type: 'object',
        description: "Overrides for 'delete' requests.",
        properties: {
          roles,
          query,
          method: {
            type: 'string',
            default: 'DELETE',
            description: 'HTTP method to use for this type of request.',
          },
          url: {
            type: 'string',
            default: '/api/apps/{appId}/{resource}/{id}',
            description: 'URL to use for this type of request.',
          },
          hooks: {
            $ref: '#/components/schemas/ResourceHooksDefinition',
          },
        },
      },
      blobs: {
        type: 'object',
        description: "Overrides for 'query' requests.",
        properties: {
          type: {
            type: 'string',
            default: 'upload',
          },
          method: {
            type: 'string',
            default: 'post',
          },
          url: {
            type: 'string',
            default: '/api/apps/{appId}/assets',
          },
          serialize: {
            type: 'string',
            enum: ['custom'],
          },
        },
      },
    },
  },
};
