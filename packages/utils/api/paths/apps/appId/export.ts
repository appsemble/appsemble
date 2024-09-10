import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [{ $ref: '#/components/parameters/appId' }],
  get: {
    tags: ['main', 'app'],
    description: 'Export an app as a zip file',
    operationId: 'exportApp',
    parameters: [
      {
        name: 'resources',
        schema: { type: 'boolean' },
        description: 'Whether to include resources for an app.',
        in: 'query',
      },
      {
        name: 'assets',
        schema: { type: 'boolean' },
        description: 'Whether to include assets in the export file',
        in: 'query',
      },
      {
        name: 'screenshots',
        schema: { type: 'boolean' },
        description: 'Whether to include screenshots in the export file',
        in: 'query',
      },
      {
        name: 'readmes',
        schema: { type: 'boolean' },
        description: 'Whether to include readmes in the export file',
        in: 'query',
      },
    ],
    responses: {
      200: {
        description: 'App exported successfully.',
      },
    },
    security: [{ studio: [] }, { cli: ['apps:export'] }],
  },
};
