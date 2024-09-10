import { type OpenAPIV3 } from 'openapi-types';

import { paths as appCollectionsPaths } from './app-collections/index.js';
import { paths as appsPaths } from './apps/index.js';
import { paths as blocksPaths } from './blocks/index.js';
import { paths as invitesPaths } from './invites/index.js';
import { paths as membersPaths } from './members/index.js';

export const paths: OpenAPIV3.PathsObject = {
  ...appCollectionsPaths,
  ...appsPaths,
  ...blocksPaths,
  ...invitesPaths,
  ...membersPaths,
  '/api/main/organizations': {
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
  '/api/main/organizations/{organizationId}': {
    parameters: [{ $ref: '#/components/parameters/organizationId' }],
    get: {
      tags: ['main', 'organization'],
      description: 'Get a single organization.',
      operationId: 'getOrganization',
      responses: {
        200: {
          $ref: '#/components/responses/organization',
        },
      },
    },
    patch: {
      tags: ['main', 'organization'],
      description: 'Update an organization',
      operationId: 'patchOrganization',
      requestBody: {
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              properties: {
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
        200: { $ref: '#/components/responses/organization' },
      },
      security: [{ studio: [] }, { cli: ['organizations:write'] }],
    },
    delete: {
      tags: ['main', 'organization'],
      description: 'Delete an organization.',
      operationId: 'deleteOrganization',
      responses: {
        200: {
          description: 'successfully deleted organization',
        },
      },
      security: [{ studio: [] }, {}],
    },
  },
  '/api/main/organizations/{organizationId}/icon': {
    parameters: [{ $ref: '#/components/parameters/organizationId' }],
    get: {
      tags: ['organization'],
      description: 'Get the organization icon.',
      operationId: 'getOrganizationIcon',
      responses: {
        200: {
          description: 'The icon that represents the organization.',
        },
      },
    },
  },
};
