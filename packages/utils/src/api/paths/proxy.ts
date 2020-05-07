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
    security: [{ app: ['proxy'] }, {}],
  };
}

export default {
  '/apps/{appId}/proxy': {
    parameters: [
      { $ref: '#/components/parameters/appId' },
      {
        in: 'query',
        name: 'path',
        description: 'The path to the request action to proxy.',
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
