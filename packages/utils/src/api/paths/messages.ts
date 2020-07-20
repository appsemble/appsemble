export default {
  '/apps/{appId}/messages': {
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
      security: [{ studio: [] }, {}],
    },
  },
  '/apps/{appId}/messages/{language}': {
    parameters: [
      { $ref: '#/components/parameters/appId' },
      { $ref: '#/components/parameters/language' },
    ],
    get: {
      tags: ['language'],
      description: 'Get the app’s messages for this language.',
      operationId: 'getMessages',
      responses: {
        200: {
          description: 'The assets associated with the app.',
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
    },
  },
};
