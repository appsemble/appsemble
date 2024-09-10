import { type OpenAPIV3 } from 'openapi-types';

import { paths as idPaths } from './appId/index.js';
import { paths as assetsPaths } from './assets/index.js';
import { paths as messagesPaths } from './messages/index.js';
import { paths as quotasPaths } from './quotas/index.js';
import { paths as ratingsPaths } from './ratings/index.js';
import { paths as readmesPaths } from './readmes/index.js';
import { paths as resourcesPaths } from './resources/index.js';
import { paths as samlPaths } from './saml/index.js';
import { paths as scimPaths } from './scim/index.js';
import { paths as screenshotsPaths } from './screenshots/index.js';
import { paths as secretsPaths } from './secrets/index.js';
import { paths as snapshotsPaths } from './snapshots/index.js';
import { paths as subscriptionsPaths } from './subscriptions/index.js';
import { paths as templatePaths } from './templates.js';
import { paths as variablesPaths } from './variables/index.js';
import { hexColor } from '../../../../constants/index.js';

export const paths: OpenAPIV3.PathsObject = {
  ...assetsPaths,
  ...idPaths,
  ...messagesPaths,
  ...quotasPaths,
  ...ratingsPaths,
  ...readmesPaths,
  ...resourcesPaths,
  ...samlPaths,
  ...scimPaths,
  ...screenshotsPaths,
  ...secretsPaths,
  ...snapshotsPaths,
  ...subscriptionsPaths,
  ...templatePaths,
  ...variablesPaths,
  '/api/apps': {
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
      description: 'Get all existing apps.',
      operationId: 'queryApps',
      responses: {
        200: {
          description: 'The list of all apps.',
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
  },
};
