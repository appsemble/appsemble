import { type OpenAPIV3 } from 'openapi-types';

export const paths: OpenAPIV3.PathsObject = {
  '/api/organizations/{organizationId}/apps': {
    parameters: [{ $ref: '#/components/parameters/organizationId' }],
    get: {
      tags: ['main', 'organization', 'app'],
      parameters: [
        {
          name: 'language',
          schema: { type: 'string' },
          description: 'The language to include the translations of, if available',
          in: 'query',
        },
      ],
      description:
        'Get a list of an organization’s apps. Private apps are excluded unless the user is in the organization.',
      operationId: 'getOrganizationApps',
      responses: {
        200: {
          description: 'The list of this organization’s apps.',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/App',
                },
              },
            },
          },
        },
      },
      security: [{ studio: [] }, {}],
    },
  },
  // TODO: FIX DUPLICATE
  '/api/organizations/{organizationId}/apps/import': {
    parameters: [{ $ref: '#/components/parameters/organizationId' }],
    post: {
      tags: ['main', 'app'],
      description: 'Import an app from a zip file',
      operationId: 'importApp',
      requestBody: {
        content: {
          'application/zip': {
            schema: {
              type: 'string',
              format: 'binary',
            },
          },
        },
      },
      responses: {
        200: {
          description: 'App imported successfully',
          $ref: '#/components/responses/app',
        },
      },
      security: [{ studio: [] }, { cli: ['apps:write'] }],
    },
  },
};
