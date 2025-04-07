import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [
    { $ref: '#/components/parameters/appId' },
    { $ref: '#/components/parameters/resourceType' },
    { $ref: '#/components/parameters/resourceId' },
    { $ref: '#/components/parameters/selectedGroupId' },
    { $ref: '#/components/parameters/$filter' },
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
            required: ['prevResourcePosition', 'nextResourcePosition'],
            properties: {
              prevResourcePosition: {
                oneOf: [
                  {
                    type: 'number',
                    minimum: 0,
                  },
                  {
                    enum: [null],
                  },
                ],
              },
              nextResourcePosition: {
                oneOf: [{ type: 'number', minimum: 0 }, { enum: [null] }],
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
