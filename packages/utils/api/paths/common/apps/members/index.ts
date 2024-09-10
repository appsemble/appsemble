import { type OpenAPIV3 } from 'openapi-types';

export const paths: OpenAPIV3.PathsObject = {
  '/api/common/apps/{appId}/members': {
    parameters: [
      { $ref: '#/components/parameters/appId' },
      { in: 'query', name: 'demo', description: 'Whether to fetch demo app members' },
    ],
    get: {
      tags: ['common', 'app', 'member'],
      description: 'Fetch all members of an app.',
      operationId: 'getAppMembers',
      responses: {
        200: {
          description: 'The list of app members.',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/OrganizationMember',
                },
              },
            },
          },
        },
      },
      security: [{ studio: [] }, { app: ['openid'] }],
    },
  },
  '/api/common/apps/{appId}/members/{memberId}': {
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
      operationId: 'getAppMember',
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
    post: {
      tags: ['common', 'app', 'member'],
      description: 'Assign an app role to a member.',
      operationId: 'setAppMember',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['role'],
              properties: {
                role: {
                  type: 'string',
                  description: 'The role to assign.',
                },
                properties: {
                  type: 'object',
                  additionalProperties: { type: 'string' },
                  description: 'Any additional properties that are allowed to be set for members.',
                },
              },
            },
          },
        },
      },
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
  },
  '/api/common/apps/{appId}/members/{memberId}/picture': {
    parameters: [
      { $ref: '#/components/parameters/appId' },
      {
        name: 'memberId',
        in: 'path',
        description: 'The id of the member on which to perform the operation',
        required: true,
        schema: { $ref: '#/components/schemas/User/properties/id' },
      },
    ],
    get: {
      tags: ['common', 'app', 'member'],
      description: `Get an app member’s profile picture.

This will return a 404 if the user has not uploaded one.`,
      operationId: 'getAppMemberPicture',
      responses: {
        200: {
          description: 'The profile picture of the app member.',
          content: {
            'image/png': {},
            'image/jpeg': {},
            'image/tiff': {},
            'image/webp': {},
          },
        },
      },
    },
  },
};
