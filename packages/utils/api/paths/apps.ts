import { type OpenAPIV3 } from 'openapi-types';

import { hexColor } from '../../constants/index.js';

export const pathItems: OpenAPIV3.PathItemObject = {
  post: {
    tags: ['main', 'app'],
    description: 'Create a new app',
    operationId: 'createApp',
    parameters: [
      {
        in: 'query',
        name: 'dryRun',
        description:
          'Validate whether an app could be created without actually creating one. Must be set to ‘true’.',
        schema: { type: 'string' },
      },
    ],
    requestBody: {
      content: {
        'multipart/form-data': {
          schema: {
            type: 'object',
            required: ['OrganizationId', 'yaml'],
            properties: {
              domain: {
                $ref: '#/components/schemas/App/properties/domain',
              },
              path: {
                $ref: '#/components/schemas/App/properties/path',
              },
              visibility: {
                $ref: '#/components/schemas/App/properties/visibility',
              },
              template: {
                $ref: '#/components/schemas/App/properties/template',
              },
              demoMode: {
                $ref: '#/components/schemas/App/properties/demoMode',
              },
              totp: {
                $ref: '#/components/schemas/App/properties/totp',
              },
              yaml: {
                type: 'string',
                description: 'The original YAML definition used to define the app.',
              },
              OrganizationId: {
                $ref: '#/components/schemas/Organization/properties/id',
              },
              icon: {
                type: 'string',
                format: 'binary',
                description: 'The app icon.',
              },
              maskableIcon: {
                type: 'string',
                format: 'binary',
                description: 'The app icon.',
              },
              iconBackground: {
                type: 'string',
                pattern: hexColor.source,
                description: 'The background color to use for the maskable icon.',
              },
              coreStyle: {
                type: 'string',
                description: 'The custom style to apply to the core app.',
              },
              sharedStyle: {
                type: 'string',
                description: 'The custom style to apply to all parts of app.',
              },
              supportedLanguages: {
                $ref: '#/components/schemas/App/properties/supportedLanguages',
              },
              screenshots: {
                type: 'array',
                description: 'Screenshots to showcase in the store',
                items: {
                  type: 'string',
                  format: 'binary',
                },
              },
              readmes: {
                type: 'array',
                description: 'Readmes to showcase in the store',
                items: {
                  type: 'string',
                  format: 'binary',
                },
              },
              controllerCode: {
                type: 'string',
                description: 'Custom app logic as a JavaScript string',
              },
              controllerImplementations: {
                type: 'string',
                description: 'Appsemble SDK interfaces implementations',
              },
            },
          },
          encoding: {
            coreStyle: { contentType: 'text/css' },
            sharedStyle: { contentType: 'text/css' },
            icon: {
              contentType: 'image/png,image/jpeg,image/tiff,image/webp',
            },
            screenshots: {
              contentType: 'image/png,image/jpeg,image/tiff,image/webp',
            },
          },
        },
      },
    },
    responses: {
      201: {
        description: 'The app that was created.',
        $ref: '#/components/responses/app',
      },
    },
    security: [{ studio: [] }, { cli: ['apps:write'] }],
  },
  get: {
    tags: ['main', 'app'],
    parameters: [
      {
        name: 'language',
        schema: { type: 'string' },
        description: 'The language to include the translations of, if available',
        in: 'query',
      },
    ],
    description: 'Get all publically available apps.',
    operationId: 'queryApps',
    responses: {
      200: {
        description: 'The list of all public apps.',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/App',
              },
            },
          },
        },
      },
    },
    security: [{ studio: [] }, {}],
  },
};
