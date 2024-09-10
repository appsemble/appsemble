import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [
    { $ref: '#/components/parameters/appId' },
    {
      name: 'memberId',
      in: 'path',
      description: 'The id of the app member on which to perform an operation',
      required: true,
      schema: { $ref: '#/components/schemas/User/properties/id' },
    },
  ],
  get: {
    tags: ['common', 'app', 'member'],
    description: 'Get an app member.',
    operationId: 'getAppMemberById',
    responses: {
      200: {
        description: 'The resulting app member.',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/OrganizationMember',
            },
          },
        },
      },
    },
    security: [{ studio: [] }, { app: ['openid'] }],
  },
  patch: {
    tags: ['common', 'app', 'member'],
    description: 'Patch an app member.',
    operationId: 'patchAppMemberById',
    security: [{ studio: [] }],
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
