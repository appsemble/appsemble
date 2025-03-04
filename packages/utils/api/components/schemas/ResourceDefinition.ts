import { type OpenAPIV3 } from 'openapi-types';

const query: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'The query parameters to use in the request.',
  additionalProperties: { type: 'string' },
};

const referenceActionTrigger: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  additionalProperties: false,
  description: 'Defines the type of trigger and the cascading strategy for it',
  required: ['type'],
  properties: {
    type: {
      enum: ['create', 'update', 'delete'],
    },
    cascade: {
      description: `Defines the cascading strategy.

If 'update' is specified, the referencing property of the referencing resource is set to null.

If 'delete' is specified, the referencing resource is deleted.

If not specified, the referenced resource cannot be deleted
without deleting the referencing resource first.`,
      enum: ['update', 'delete'],
    },
  },
};

const referenceAction: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  additionalProperties: false,
  description:
    'Defines what happens when the specified action is executed on the referenced resource.',
  properties: {
    triggers: {
      type: 'array',
      items: referenceActionTrigger,
      minItems: 1,
      uniqueItems: true,
    },
  },
};

export const ResourceDefinition: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  additionalProperties: false,
  description: 'A definition of how this resource works.',
  required: ['schema'],
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
    clonable: {
      type: 'boolean',
      description:
        'Whether the resource should be able to be transferred when cloning the app it belongs to',
    },
    schema: {
      $ref: '#/components/schemas/JSONSchemaRoot',
      description: 'JSON schema definitions that may be used by the app.',
    },
    references: {
      type: 'object',
      description: `References to other resources.

The key is the property that references the other resource. The value is an object describing the
name of the resource and how it should behave.
`,
      minProperties: 1,
      additionalProperties: {
        type: 'object',
        description: 'A reference to between two resource types.',
        additionalProperties: false,
        properties: {
          resource: { type: 'string' },
          create: referenceAction,
          patch: referenceAction,
          update: referenceAction,
          delete: referenceAction,
        },
      },
    },
    positioning: {
      type: 'boolean',
      default: false,
      description:
        'Whether to enable position column for the instances of this resource. This is used for keeping an ordered list to enable custom sorting of the data using drag and drop features.',
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
    history: {
      description: 'A definition of how versioning should happen for instances of this resource.',
      default: false,
      oneOf: [
        {
          type: 'boolean',
          description:
            'Setting this to `true` is the same as using an object with the property `data` set to `true`.',
        },
        { $ref: '#/components/schemas/ResourceHistoryDefinition' },
      ],
    },
    query: {
      type: 'object',
      description: "Overrides for 'query' requests.",
      additionalProperties: false,
      properties: {
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
      additionalProperties: false,
      properties: {
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
      additionalProperties: false,
      properties: {
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
      additionalProperties: false,
      properties: {
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
    patch: {
      type: 'object',
      description: "Overrides for 'patch' requests.",
      additionalProperties: false,
      properties: {
        query,
        method: {
          type: 'string',
          default: 'PATCH',
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
      additionalProperties: false,
      properties: {
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
      additionalProperties: false,
      properties: {
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
    views: {
      $ref: '#/components/schemas/ResourceViewDefinition',
    },
  },
};
