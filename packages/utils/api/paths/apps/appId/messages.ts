import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [
    { $ref: '#/components/parameters/appId' },
    { name: 'merge', in: 'query', schema: { type: 'boolean' } },
    { name: 'includeMessages', in: 'query', schema: { type: 'boolean' } },
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
  post: {
    tags: ['main', 'apps', 'language'],
    description: 'Upload messages for the given language.',
    operationId: 'createAppMessages',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            oneOf: [
              { $ref: '#/components/schemas/AppMessages' },
              {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/AppMessages',
                },
              },
            ],
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
              oneOf: [
                { $ref: '#/components/schemas/AppMessages' },
                {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/AppMessages',
                  },
                },
              ],
            },
          },
        },
      },
    },
    security: [{ studio: [] }, { cli: ['apps:write'] }],
  },
};
