import { type OpenAPIV3 } from 'openapi-types';

import { paths as authPaths } from './auth/index.js';

export const paths: OpenAPIV3.PathsObject = {
  ...authPaths,
  '/api/apps/{appId}/members/current': {
    parameters: [{ $ref: '#/components/parameters/appId' }],
    patch: {
      description: 'Update app member data',
      tags: ['app', 'member'],
      operationId: 'patchCurrentAppMember',
      security: [{ studio: [] }, { app: [] }],
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
                $ref: '#/components/schemas/AppAccount',
              },
            },
          },
        },
      },
    },
  },
};
