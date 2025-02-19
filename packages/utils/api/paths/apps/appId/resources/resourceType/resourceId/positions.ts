import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [
    { $ref: '#/components/parameters/appId' },
    { $ref: '#/components/parameters/resourceType' },
    { $ref: '#/components/parameters/resourceId' },
  ],
  put: {
    tags: ['app', 'resource', 'positioning', 'custom-sort'],
    description: 'Update the current position of the resource in the order.',
    operationId: 'updateAppResourcePosition',
    requestBody: {
      content: {
        'application/json': {
          schema: {
            type: 'object',
            description: '',
            anyOf: [
              {
                required: ['prevResourcePosition'],
              },
              {
                required: ['nextResourcePosition'],
              },
            ],
            properties: {
              prevResourcePosition: {
                type: 'number',
                nullable: true,
                minimum: 0,
              },
              nextResourcePosition: {
                type: 'number',
                nullable: true,
                minimum: 0,
              },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: 'The subscription status of the resource that matches the given id.',
        content: {
          'application/json': {
            schema: {
              type: 'number',
              description: 'The updated position',
            },
          },
        },
      },
    },
    security: [{ app: ['resources:manage'] }, {}],
  },
};
