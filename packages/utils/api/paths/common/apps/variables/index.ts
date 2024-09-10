import { type OpenAPIV3 } from 'openapi-types';

export const paths: OpenAPIV3.PathsObject = {
  '/api/common/apps/{appId}/variables': {
    parameters: [{ $ref: '#/components/parameters/appId' }],
    get: {
      tags: ['common', 'app', 'variable'],
      operationId: 'getAppVariables',
      responses: {
        200: {
          description: 'The list of app variables.',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: { $ref: '#/components/schemas/AppVariable' },
              },
            },
          },
        },
      },
    },
  },
};
