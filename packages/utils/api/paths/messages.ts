import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [
    { name: 'context', in: 'query', schema: { type: 'string', enum: ['studio', 'app'] } },
  ],
  get: {
    tags: ['common', 'translation'],
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
};
