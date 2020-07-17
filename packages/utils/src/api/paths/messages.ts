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
              type: 'object',
              required: ['language', 'content'],
              properties: {
                language: { type: 'string' },
                content: { type: 'object', additionalProperties: { type: 'string' } },
              },
            },
          },
        },
      },
      responses: {
        204: {
          description: 'The translation was created.',
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
            'application/x-yaml': {
              schema: { type: 'string', format: 'binary' },
            },
          },
        },
      },
    },
  },
};
