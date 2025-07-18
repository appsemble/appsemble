import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [
    { $ref: '#/components/parameters/appId' },
    {
      name: 'appMemberId',
      in: 'path',
      description: 'The id of the app member on which to perform an operation',
      required: true,
      schema: { $ref: '#/components/schemas/AppMember/properties/id' },
    },
  ],
  patch: {
    tags: ['common', 'app-member'],
    description: 'Patch the properties of an app member.',
    operationId: 'patchAppMemberProperties',
    parameters: [{ $ref: '#/components/parameters/selectedGroupId' }],
    requestBody: {
      content: {
        'multipart/form-data': {
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              properties: {
                type: 'object',
                additionalProperties: { type: 'string' },
                description: 'The member’s custom properties.',
              },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: 'The updated app member',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/AppMember',
            },
          },
        },
      },
    },
    security: [{ studio: [] }, { app: [] }],
  },
};
