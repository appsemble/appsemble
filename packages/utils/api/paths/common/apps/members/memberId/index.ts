import { type OpenAPIV3 } from 'openapi-types';

import { paths as picturePaths } from './picture.js';

export const paths: OpenAPIV3.PathsObject = {
  ...picturePaths,
  '/api/apps/{appId}/members/{memberId}': {
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
    patch: {
      tags: ['common', 'app', 'member'],
      description: 'Patch an app member.',
      operationId: 'patchAppMemberById',
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
};
