import type { OpenAPIV3 } from 'openapi-types';

function proxy(method: string): OpenAPIV3.OperationObject {
  return {
    tags: ['proxy'],
    description: `Proxy a ${method.toUpperCase()} request action`,
    operationId: `proxy${method}`,
    responses: {
      default: {
        description: 'The proxied response',
      },
    },
  };
}

export default {
  '/apps/{appId}/proxy/{path}': {
    parameters: [
      { $ref: '#/components/parameters/appId' },
      {
        in: 'path',
        name: 'path',
        description: 'The path to the request action to proxy.',
        required: true,
        schema: { type: 'string' },
      },
    ],
    get: proxy('Get'),
    delete: proxy('Delete'),
    patch: proxy('Get'),
    post: proxy('Post'),
    put: proxy('Put'),
  },
};
