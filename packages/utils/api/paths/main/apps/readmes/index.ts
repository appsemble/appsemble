import { type OpenAPIV3 } from 'openapi-types';

export const paths: OpenAPIV3.PathsObject = {
  '/api/apps/{appId}/readmes/{readmeId}': {
    parameters: [
      { $ref: '#/components/parameters/appId' },
      { $ref: '#/components/parameters/readmeId' },
    ],
    get: {
      tags: ['main', 'app', 'readme'],
      description: 'Get a readme of an app.',
      operationId: 'getAppReadme',
      responses: {
        200: {
          description: 'The app readme',
        },
      },
    },
  },
};
