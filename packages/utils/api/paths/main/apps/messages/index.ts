import { type OpenAPIV3 } from 'openapi-types';

import { paths as languagePaths } from './language.js';

export const paths: OpenAPIV3.PathsObject = {
  ...languagePaths,
  '/api/apps/{appId}/messages': {
    parameters: [
      { $ref: '#/components/parameters/appId' },
      { name: 'merge', in: 'query', schema: { type: 'boolean' } },
      { name: 'includeMessages', in: 'query', schema: { type: 'boolean' } },
    ],
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
  },
};
