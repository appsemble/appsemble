import { type OpenAPIV3 } from 'openapi-types';

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
import { paths as variablesPaths } from './variables/index.js';
import { hexColor } from '../../../../constants/index.js';

export const paths: OpenAPIV3.PathsObject = {
  ...assetsPaths,
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
  ...variablesPaths,
  '/api/main/apps': {
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
  '/api/main/apps/{appId}': {
    parameters: [{ $ref: '#/components/parameters/appId' }],
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
      description: 'Get a single app',
      operationId: 'getAppById',
      responses: {
        200: {
          description: 'The app that matches the given id.',
          $ref: '#/components/responses/app',
        },
      },
      security: [{ studio: [] }, {}],
    },
    patch: {
      tags: ['main', 'app'],
      description: 'Update parts of an existing app',
      operationId: 'patchApp',
      requestBody: {
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
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
                force: {
                  type: 'boolean',
                  description: 'Whether the locked property should be ignored.',
                },
                yaml: {
                  type: 'string',
                  description: 'The original YAML definition used to define the app.',
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
                showAppsembleLogin: {
                  type: 'boolean',
                  description: 'Whether the Appsemble login method should be shown.',
                },
                showAppsembleOAuth2Login: {
                  type: 'boolean',
                  description: 'Whether the Appsemble OAuth2 login method should be shown.',
                },
                enableSelfRegistration: {
                  type: 'boolean',
                  description: 'Whether new users should be able to register themselves.',
                },
                emailName: {
                  type: 'string',
                  description: 'The name used for emails.',
                },
                emailHost: {
                  type: 'string',
                  description: 'The hostname of the SMTP server.',
                },
                emailPassword: {
                  type: 'string',
                  description:
                    'The password to use for SMTP authentication. This gets encrypted when stored.',
                },
                emailUser: {
                  type: 'string',
                  description: 'The username used to authenticate against the SMTP server.',
                },
                emailPort: {
                  type: 'string',
                  description: 'The port used for the SMTP server.',
                },
                emailSecure: {
                  type: 'boolean',
                  description: 'Whether TLS is being used.',
                },
                containers: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/ContainerDefinition' },
                },
              },
            },
            encoding: {
              coreStyle: { contentType: 'text/css' },
              sharedStyle: { contentType: 'text/css' },
              icon: {
                contentType: 'image/png,image/jpeg,image/tiff,image/webp',
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'The updated app.',
          $ref: '#/components/responses/app',
        },
      },
      security: [{ studio: [] }, { cli: ['apps:write'] }],
    },
    delete: {
      tags: ['main', 'app'],
      description: 'Delete an existing app',
      operationId: 'deleteApp',
      responses: {
        204: {
          description: 'The app was successfully deleted.',
        },
      },
      security: [{ studio: [] }, { cli: ['apps:delete'] }],
    },
  },
  '/api/main/apps/{appId}/icon': {
    parameters: [{ $ref: '#/components/parameters/appId' }],
    delete: {
      tags: ['main', 'app'],
      description: 'Delete the current app icon.',
      operationId: 'deleteAppIcon',
      responses: {
        204: {
          description: 'The icon has been successfully removed',
        },
      },
      security: [{ studio: [] }, { cli: ['apps:write'] }],
    },
  },
  '/api/main/apps/{appId}/export': {
    parameters: [{ $ref: '#/components/parameters/appId' }],
    get: {
      tags: ['main', 'app'],
      description: 'Export an app as a zip file',
      operationId: 'exportApp',
      parameters: [
        {
          name: 'resources',
          schema: { type: 'boolean' },
          description: 'Whether to include resources for an app.',
          in: 'query',
        },
        {
          name: 'assets',
          schema: { type: 'boolean' },
          description: 'Whether to include assets in the export file',
          in: 'query',
        },
        {
          name: 'screenshots',
          schema: { type: 'boolean' },
          description: 'Whether to include screenshots in the export file',
          in: 'query',
        },
        {
          name: 'readmes',
          schema: { type: 'boolean' },
          description: 'Whether to include readmes in the export file',
          in: 'query',
        },
      ],
      responses: {
        200: {
          description: 'App exported successfully.',
        },
      },
      security: [{ studio: [] }, { cli: ['apps:export'] }],
    },
  },
  '/api/main/apps/{appId}/lock': {
    parameters: [{ $ref: '#/components/parameters/appId' }],
    post: {
      tags: ['main', 'app'],
      description: 'Update the locked property an app.',
      operationId: 'setAppLock',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['locked'],
              properties: {
                locked: {
                  $ref: '#/components/schemas/App/properties/locked',
                  description: 'Whether the app should be locked.',
                },
              },
            },
          },
        },
      },
      responses: {
        204: {
          description: 'Lock status successfully changed',
          content: {
            'application/zip': {},
          },
        },
      },
      security: [{ studio: [] }, { cli: ['apps:write'] }],
    },
  },
  '/api/main/apps/{appId}/email': {
    parameters: [{ $ref: '#/components/parameters/appId' }],
    get: {
      tags: ['main', 'app'],
      description: 'Get the app’s email settings.',
      operationId: 'getAppEmailSettings',
      responses: {
        200: {
          description: 'The current app email settings',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  emailName: {
                    type: 'string',
                    description: 'The name used for emails.',
                  },
                  emailHost: {
                    type: 'string',
                    description: 'The hostname of the SMTP server.',
                  },
                  emailPassword: {
                    type: 'boolean',
                    description: 'Whether a password is set.',
                  },
                  emailUser: {
                    type: 'string',
                    description: 'The username used to authenticate against the SMTP server.',
                  },
                  emailPort: {
                    type: 'string',
                    description: 'The port used for the SMTP server.',
                  },
                  emailSecure: {
                    type: 'boolean',
                    description: 'Whether TLS is being used.',
                  },
                },
              },
            },
          },
        },
      },
      security: [{ studio: [] }, { cli: ['apps:write'] }],
    },
  },
  '/api/main/apps/{appId}/maskable-icon': {
    parameters: [{ $ref: '#/components/parameters/appId' }],
    delete: {
      tags: ['main', 'app'],
      description: 'Delete the current app’s maskable icon.',
      operationId: 'deleteAppMaskableIcon',
      responses: {
        204: {
          description: 'The icon has been successfully removed',
        },
      },
      security: [{ studio: [] }, { cli: ['apps:write'] }],
    },
  },
  '/api/main/apps/{appId}/broadcast': {
    parameters: [{ $ref: '#/components/parameters/appId' }],
    post: {
      tags: ['main', 'app'],
      description: 'Broadcast a push notification to every subscriber of the app.',
      operationId: 'sendAppNotifications',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              description: 'The data to include in the notification',
              required: ['body'],
              properties: {
                title: {
                  description:
                    'The title of the notification. This defaults to the name of the app if not otherwise specified.',
                  type: 'string',
                },
                body: {
                  description: 'The content of the notification',
                  type: 'string',
                },
              },
            },
          },
        },
      },
      responses: {
        204: {
          description: 'The notification has been successfully broadcasted.',
        },
      },
      security: [{ studio: [] }],
    },
  },
  '/api/main/apps/{appId}/reseed': {
    parameters: [{ $ref: '#/components/parameters/appId' }],
    post: {
      tags: ['main', 'app'],
      operationId: 'reseedDemoApp',
      responses: {
        200: { description: 'The app has successfully been reseeded.' },
      },
      security: [{ studio: ['apps:write'] }],
    },
  },
  '/api/main/app-templates': {
    get: {
      tags: ['main', 'app', 'template'],
      description: 'Fetch a list of all available templates.',
      operationId: 'getAppTemplates',
      responses: {
        200: {
          description: 'The list of all available templates.',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    template: {
                      type: 'string',
                      description: 'The name of the template.',
                    },
                    description: {
                      type: 'string',
                      description: 'The description of the template.',
                    },
                    resources: {
                      type: 'boolean',
                      description: 'Whether this template supports pre-made resources',
                    },
                  },
                },
              },
            },
          },
        },
      },
      security: [{ studio: [] }],
    },
    post: {
      tags: ['main', 'app', 'template'],
      description: 'Register a new app using a template.',
      operationId: 'createAppFromTemplate',
      requestBody: {
        description: 'The template to use for app creation.',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['templateId', 'organizationId'],
              properties: {
                templateId: {
                  type: 'number',
                  description: 'The ID of the template.',
                },
                name: {
                  $ref: '#/components/schemas/AppDefinition/properties/name',
                },
                description: {
                  $ref: '#/components/schemas/AppDefinition/properties/description',
                },
                organizationId: {
                  $ref: '#/components/schemas/Organization/properties/id',
                },
                resources: {
                  type: 'boolean',
                  description: 'Include example resources.',
                },
                assets: {
                  type: 'boolean',
                  description: 'Include example assets.',
                },
                variables: {
                  type: 'boolean',
                  description: 'Include example variables.',
                },
                secrets: {
                  type: 'boolean',
                  description: 'Include example secrets.',
                },
                visibility: {
                  $ref: '#/components/schemas/App/properties/visibility',
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          $ref: '#/components/responses/app',
        },
      },
      security: [{ studio: [] }],
    },
  },
  '/api/main/apps/{appId}/style/block/@{organizationId}/{blockId}': {
    parameters: [
      { $ref: '#/components/parameters/appId' },
      { $ref: '#/components/parameters/organizationId' },
      { $ref: '#/components/parameters/blockId' },
    ],
    post: {
      tags: ['main', 'app', 'block'],
      description: 'Upload a block stylesheet for this app.',
      operationId: 'setAppBlockStyle',
      requestBody: {
        description: 'The new app block stylesheet.',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['style'],
              properties: {
                style: {
                  type: 'string',
                },
                force: {
                  type: 'boolean',
                  writeOnly: true,
                  description: 'If this is true, the app lock is ignored.',
                },
              },
            },
          },
        },
      },
      responses: {
        204: {
          description: 'The block style has been updated successfully.',
        },
      },
      security: [{ studio: [] }, { cli: ['apps:write'] }],
    },
  },
};
