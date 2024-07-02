import { type OpenAPIV3 } from 'openapi-types';

export const paths: OpenAPIV3.PathsObject = {
  '/api/apps/{appId}/messages': {
    parameters: [
      { $ref: '#/components/parameters/appId' },
      { name: 'merge', in: 'query', schema: { type: 'boolean' } },
    ],
    get: {
      tags: ['common', 'apps', 'language'],
      description: 'Get a list of all languages with messages.',
      operationId: 'getAppLanguages',
      responses: {
        200: {
          description: 'The list of supported languages',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  oneOf: [{ type: 'string' }, { $ref: '#/components/schemas/AppMessages' }],
                },
              },
            },
          },
        },
      },
    },
  },
  '/api/apps/{appId}/messages/{language}': {
    parameters: [
      { $ref: '#/components/parameters/appId' },
      { $ref: '#/components/parameters/language' },
      {
        in: 'query',
        name: 'merge',
        description: 'Whether the language’s messages should be merged with its base language.',
        schema: { type: 'string' },
      },
      {
        in: 'query',
        name: 'override',
        description: 'Whether the app’s language overrides should be included and merged.',
        schema: { type: 'string', default: 'true' },
      },
    ],
    get: {
      tags: ['common', 'apps', 'language'],
      description: 'Get the app’s messages for this language.',
      operationId: 'getAppMessages',
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
