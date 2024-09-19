import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [{ $ref: '#/components/parameters/organizationId' }],
  get: {
    tags: ['main', 'organization', 'app-collection'],
    description: 'Get a list of app collections for an organization',
    operationId: 'queryOrganizationAppCollections',
    parameters: [
      {
        name: 'organizationId',
        in: 'path',
        description: 'The id of the organization',
        required: true,
        schema: {
          $ref: '#/components/schemas/Organization/properties/id',
        },
      },
    ],
    responses: {
      200: {
        description: 'A list of app collections',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/AppCollection',
              },
            },
          },
        },
      },
    },
    security: [{ studio: [] }, {}],
  },
  post: {
    tags: ['main', 'organization', 'app-collection'],
    description: 'Create an app collection',
    operationId: 'createOrganizationAppCollection',
    requestBody: {
      description: 'The app collection to create',
      required: true,
      content: {
        'multipart/form-data': {
          schema: {
            allOf: [
              { $ref: '#/components/schemas/AppCollectionDefinition' },
              { required: ['name', 'expertName', 'expertProfileImage', 'headerImage'] },
            ],
          },
          encoding: {
            expertProfileImage: {
              contentType: 'image/png,image/jpeg,image/tiff,image/webp',
            },
            headerImage: {
              contentType: 'image/png,image/jpeg,image/tiff,image/webp',
            },
          },
        },
      },
    },
    responses: {
      201: {
        description: 'The created app collection',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/AppCollection',
            },
          },
        },
      },
    },
    security: [{ studio: [] }],
  },
};
