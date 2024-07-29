import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [
    { $ref: '#/components/parameters/appId' },
    {
      name: 'memberId',
      in: 'path',
      description: 'The id of the app member on which to perform an operation',
      required: true,
      schema: { $ref: '#/components/schemas/AppMember/properties/id' },
    },
  ],
  patch: {
    tags: ['common', 'app', 'member'],
    description: 'Patch an app member.',
    operationId: 'patchAppMemberById',
    requestBody: {
      content: {
        'multipart/form-data': {
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              email: {
                type: 'string',
                format: 'email',
              },
              name: {
                type: 'string',
              },
              picture: {
                type: 'string',
                format: 'binary',
                description: 'The member’s profile picture.',
              },
              properties: {
                type: 'object',
                additionalProperties: { type: 'string' },
                description: 'The member’s custom properties.',
              },
              locale: {
                type: 'string',
                description: 'The preferred locale of the user.',
              },
              role: {
                type: 'string',
              },
            },
          },
          encoding: {
            picture: {
              contentType: 'image/png,image/jpeg,image/tiff,image/webp',
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: 'A linked app account',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/AppMember',
            },
          },
        },
      },
    },
    security: [{ studio: [] }],
  },
  delete: {
    tags: ['common', 'app', 'member'],
    description: 'Delete an app member.',
    operationId: 'deleteAppMemberById',
    responses: {
      204: {
        description: 'The app member was deleted successfully.',
      },
    },
    security: [{ studio: [] }],
  },
};
