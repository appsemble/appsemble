import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [
    { $ref: '#/components/parameters/appId' },
    { $ref: '#/components/parameters/resourceType' },
    { $ref: '#/components/parameters/resourceId' },
    {
      $ref: '#/components/parameters/selectedGroupId',
      description: 'ID of the group resource belongs to this',
    },
  ],
  put: {
    tags: ['app', 'resource', 'positioning', 'custom-sort'],
    description: 'Move a resource from one group to another or from no group to other.',
    operationId: 'updateAppResourceGroup',
    requestBody: {
      content: {
        'application/json': {
          schema: {
            type: 'object',
            description: '',
            required: ['groupId'],
            properties: {
              groupId: {
                description: 'ID of the group the resource should be moved to',
              },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: 'The updated group ID.',
        content: {
          'application/json': {
            schema: {
              type: 'number',
              description: 'The updated group ID',
            },
          },
        },
      },
    },
    security: [{ app: ['resources:manage'] }, {}],
  },
};
