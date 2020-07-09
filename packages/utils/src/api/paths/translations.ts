export default {
  '/apps/{appId}/translations': {
    parameters: [{ $ref: '#/components/parameters/appId' }],
    post: {
      tags: ['language'],
      description: 'Upload a translation for the given language.',
      operationId: 'createTranslation',
      requestBody: {
        description: 'The asset to upload.',
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              required: ['content', 'language'],
              properties: {
                language: {
                  type: 'string',
                },
                content: {
                  type: 'string',
                  format: 'binary',
                },
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
  '/apps/{appId}/translations/{language}': {
    parameters: [
      { $ref: '#/components/parameters/appId' },
      { $ref: '#/components/parameters/language' },
    ],
    get: {
      tags: ['language'],
      description: 'Get the app’s translation for this language.',
      operationId: 'getTranslation',
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
