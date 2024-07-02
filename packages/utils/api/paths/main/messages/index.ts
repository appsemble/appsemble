import { type OpenAPIV3 } from 'openapi-types';

export const paths: OpenAPIV3.PathsObject = {
  '/api/messages/{language}': {
    parameters: [{ $ref: '#/components/parameters/language' }],
    get: {
      tags: ['main', 'translation'],
      description: 'Get the Appsemble messages for this language.',
      operationId: 'getStudioMessages',
      responses: {
        200: {
          description: 'The app messages for the selected language.',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/AppMessages',
              },
            },
          },
        },
      },
    },
  },
};
