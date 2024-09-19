import { type OpenAPIV3 } from 'openapi-types';

function proxy(method: string, body?: boolean): OpenAPIV3.OperationObject {
  const operation: OpenAPIV3.OperationObject = {
    tags: ['app', 'action'],
    description: `Proxy a ${method.toUpperCase()} request action`,
    operationId: `proxy${method}`,
    responses: {
      default: {
        description: 'The proxied response',
      },
    },
    security: [{ app: ['email', 'profile'] }, {}],
  };
  if (body) {
    operation.requestBody = {
      description: 'The data that was passed to the action',
      required: true,
      content: {
        'multipart/form-data': {
          schema: {
            type: 'object',
            description: 'A `multipart/form-data` representation of a resource.',
            additionalProperties: true,
            properties: {
              resource: {
                type: 'array',
                items: { $ref: '#/components/schemas/Resource' },
              },
              assets: {
                type: 'array',
                description: 'A list of assets that should be linked to the resource.',
                items: {
                  type: 'string',
                  format: 'binary',
                },
              },
            },
          },
        },
        '*/*': {},
      },
    };
  } else {
    operation.parameters = [
      {
        in: 'query',
        name: 'data',
        description: 'The data that was passed to the action',
        required: true,
        schema: { type: 'string' },
      },
    ];
  }
  return operation;
}

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [
    { $ref: '#/components/parameters/appId' },
    {
      in: 'path',
      name: 'path',
      description: 'The path to the action to execute.',
      required: true,
      schema: { type: 'string' },
    },
  ],
  get: proxy('Get'),
  delete: proxy('Delete'),
  patch: proxy('Patch', true),
  post: proxy('Post', true),
  put: proxy('Put', true),
};
