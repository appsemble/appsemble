import { type OpenAPIV3 } from 'openapi-types';

import { paths as appCollectionsPaths } from './app-collections/index.js';
import { paths as appsPaths } from './apps/index.js';
import { paths as blocksPaths } from './blocks/index.js';
import { paths as invitesPaths } from './invites/index.js';
import { paths as membersPaths } from './members/index.js';
import { paths as organizationIdPaths } from './organizationId/index.js';

export const paths: OpenAPIV3.PathsObject = {
  ...appCollectionsPaths,
  ...appsPaths,
  ...blocksPaths,
  ...invitesPaths,
  ...membersPaths,
  ...organizationIdPaths,
  '/api/organizations': {
    get: {
      tags: ['main', 'organization'],
      description: 'Fetch the list of organizations.',
      operationId: 'getOrganizations',
      responses: {
        200: {
          description: 'The list of of organizations',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/Organization',
                },
              },
            },
          },
        },
      },
    },
    post: {
      tags: ['main', 'organization'],
      description: 'Create a new organization.',
      operationId: 'createOrganization',
      requestBody: {
        description: 'The organization to create',
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              properties: {
                id: {
                  $ref: '#/components/schemas/Organization/properties/id',
                },
                name: {
                  $ref: '#/components/schemas/Organization/properties/name',
                },
                description: {
                  $ref: '#/components/schemas/Organization/properties/description',
                },
                email: {
                  $ref: '#/components/schemas/Organization/properties/email',
                },
                website: {
                  $ref: '#/components/schemas/Organization/properties/website',
                },
                icon: {
                  type: 'string',
                  format: 'binary',
                  description: 'The organization icon.',
                },
              },
            },
            encoding: {
              icon: {
                contentType: 'image/png,image/jpeg,image/tiff,image/webp',
              },
            },
          },
        },
      },
      responses: {
        201: {
          $ref: '#/components/responses/organization',
        },
      },
      security: [{ studio: [] }, { cli: ['organizations:write'] }],
    },
  },
};
