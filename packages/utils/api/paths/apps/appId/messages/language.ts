import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
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
  delete: {
    tags: ['main', 'apps', 'language'],
    description: 'Delete the app’s messages for this language.',
    operationId: 'deleteAppMessages',
    responses: {
      204: {
        description: 'The messages have successfully been deleted.',
      },
    },
    security: [{ studio: [] }],
  },
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
};
