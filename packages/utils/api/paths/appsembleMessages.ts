import { OpenAPIV3 } from 'openapi-types';

export const paths: OpenAPIV3.PathsObject = {
  '/api/messages': {
    parameters: [
      { name: 'context', in: 'query', schema: { type: 'string', enum: ['studio', 'app'] } },
    ],
    get: {
      tags: ['language'],
      description: 'Get a list of all languages with messages.',
      operationId: 'getAppsembleLanguages',
      responses: {
        200: {
          description: 'The list of supported languages',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
    },
  },
  '/api/messages/{language}': {
    parameters: [{ $ref: '#/components/parameters/language' }],
    get: {
      tags: ['language'],
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
