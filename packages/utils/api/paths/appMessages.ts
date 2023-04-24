import { type OpenAPIV3 } from 'openapi-types';

export const paths: OpenAPIV3.PathsObject = {
  '/api/apps/{appId}/messages': {
    parameters: [
      { $ref: '#/components/parameters/appId' },
      { name: 'merge', in: 'query', schema: { type: 'boolean' } },
    ],
    get: {
      tags: ['language'],
      description: 'Get a list of all languages with messages.',
      operationId: 'getLanguages',
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
    post: {
      tags: ['language'],
      description: 'Upload messages for the given language.',
      operationId: 'createMessages',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/AppMessages',
            },
          },
        },
      },
      responses: {
        201: {
          description: 'The translation was created.',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/AppMessages',
              },
            },
          },
        },
      },
      security: [{ studio: [] }, { cli: ['apps:write'] }],
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
      tags: ['language'],
      description: 'Get the app’s messages for this language.',
      operationId: 'getMessages',
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
    delete: {
      tags: ['language'],
      description: 'Delete the app’s messages for this language.',
      operationId: 'deleteMessages',
      responses: {
        204: {
          description: 'The messages have successfully been deleted.',
        },
      },
      security: [{ studio: [] }],
    },
  },
};
