import { type OpenAPIV3 } from 'openapi-types';

export const paths: OpenAPIV3.PathsObject = {
  '/api/apps/{appId}/screenshots/{screenshotId}': {
    parameters: [
      { $ref: '#/components/parameters/appId' },
      { $ref: '#/components/parameters/screenshotId' },
    ],
    get: {
      tags: ['main', 'app', 'screenshot'],
      description: 'Get a screenshot of an app.',
      operationId: 'getAppScreenshot',
      responses: {
        200: {
          description: 'The app screenshot',
        },
      },
    },
    delete: {
      tags: ['main', 'app', 'screenshot'],
      description: 'Delete an existing screenshot.',
      operationId: 'deleteAppScreenshot',
      responses: {
        200: {
          description: 'The screenshot has been successfully deleted.',
        },
      },
      security: [{ studio: [] }, { cli: ['apps:write'] }],
    },
  },
};
