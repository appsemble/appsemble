export default {
  type: 'object',
  additionalProperties: true,
  properties: {
    schema: {
      type: 'object',
      additionalProperties: true,
      description: 'JSON schema definitions that may be used by the app.',
    },
    url: {
      type: 'string',
      default: '/api/{resource}',
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
        method: {
          type: 'string',
          default: 'GET',
          description: 'HTTP method to use for this type of request.',
        },
        url: {
          type: 'string',
          default: '/api/{resource}',
          description: 'URL to use for this type of request.',
        },
      },
    },
    get: {
      type: 'object',
      description: "Overrides for 'get' requests.",
      properties: {
        method: {
          type: 'string',
          default: 'GET',
          description: 'HTTP method to use for this type of request.',
        },
        url: {
          type: 'string',
          default: '/api/{resource}/{id}',
          description: 'URL to use for this type of request.',
        },
      },
    },
    create: {
      type: 'object',
      description: "Overrides for 'create' requests.",
      properties: {
        method: {
          type: 'string',
          default: 'POST',
          description: 'HTTP method to use for this type of request.',
        },
        url: {
          type: 'string',
          default: '/api/{resource}/{id}',
          description: 'URL to use for this type of request.',
        },
      },
    },
    update: {
      type: 'object',
      description: "Overrides for 'update' requests.",
      properties: {
        method: {
          type: 'string',
          default: 'PUT',
          description: 'HTTP method to use for this type of request.',
        },
        url: {
          type: 'string',
          default: '/api/{resource}/{id}',
          description: 'URL to use for this type of request.',
        },
      },
    },
    delete: {
      type: 'object',
      description: "Overrides for 'delete' requests.",
      properties: {
        method: {
          type: 'string',
          default: 'DELETE',
          description: 'HTTP method to use for this type of request.',
        },
        url: {
          type: 'string',
          default: '/api/{resource}/{id}',
          description: 'URL to use for this type of request.',
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
          default: '/api/assets',
        },
        serialize: {
          type: 'string',
          enum: ['custom'],
        },
      },
    },
  },
};
