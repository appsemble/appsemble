import { type OpenAPIV3 } from 'openapi-types';

import { paths as languagePaths } from './language.js';

export const paths: OpenAPIV3.PathsObject = {
  ...languagePaths,
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
};
