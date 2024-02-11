import { type OpenAPIV3 } from 'openapi-types';

import { hexColor, TeamRole } from '../../constants/index.js';

export const paths: OpenAPIV3.PathsObject = {
  '/api/apps': {
    post: {
      tags: ['app'],
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
                longDescription: {
                  $ref: '#/components/schemas/App/properties/longDescription',
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
      tags: ['app'],
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
  '/api/apps/{appId}': {
    parameters: [{ $ref: '#/components/parameters/appId' }],
    get: {
      tags: ['app'],
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
      tags: ['app'],
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
                longDescription: {
                  $ref: '#/components/schemas/App/properties/longDescription',
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
      tags: ['app'],
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
  '/api/apps/import/organization/{organizationId}': {
    parameters: [{ $ref: '#/components/parameters/organizationId' }],
    post: {
      tags: ['app', 'import', 'zip'],
      description: 'Import an app from a zip file',
      operationId: 'importApp',
      requestBody: {
        content: {
          'application/zip': {
            schema: {
              type: 'string',
              format: 'binary',
            },
          },
        },
      },
      responses: {
        200: {
          description: 'App imported successfully',
          $ref: '#/components/responses/app',
        },
      },
      security: [{ studio: [] }, { cli: ['apps:write'] }],
    },
  },
  '/api/apps/{appId}/export': {
    parameters: [{ $ref: '#/components/parameters/appId' }],
    get: {
      tags: ['app', 'export', 'zip'],
      description: 'Export the app',
      operationId: 'exportApp',
      parameters: [
        {
          name: 'resources',
          schema: { type: 'boolean' },
          description: 'Whether to include resources for an app.',
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
  '/api/apps/{appId}/lock': {
    parameters: [{ $ref: '#/components/parameters/appId' }],
    post: {
      tags: ['app'],
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
  '/api/apps/{appId}/email': {
    parameters: [{ $ref: '#/components/parameters/appId' }],
    get: {
      tags: ['app'],
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
  '/api/apps/{appId}/icon': {
    parameters: [{ $ref: '#/components/parameters/appId' }],
    get: {
      tags: ['app'],
      description: 'Get the current app icon.',
      operationId: 'getAppIcon',
      responses: {
        200: {
          description: 'The icon of the app that matches the given id.',
          content: {
            'image/png': {},
            'image/jpeg': {},
            'image/tiff': {},
            'image/webp': {},
          },
        },
      },
    },
    delete: {
      tags: ['app'],
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
  '/api/apps/{appId}/maskableIcon': {
    parameters: [{ $ref: '#/components/parameters/appId' }],
    delete: {
      tags: ['app'],
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
  '/api/apps/{appId}/subscriptions': {
    parameters: [{ $ref: '#/components/parameters/appId' }],
    get: {
      tags: ['app'],
      parameters: [{ $ref: '#/components/parameters/endpoint' }],
      description: 'Fetch all subscription settings of an app.',
      operationId: 'getSubscription',
      responses: {
        200: {
          description: 'The subscription settings.',
          $ref: '#/components/responses/subscriptions',
        },
      },
    },
    post: {
      tags: ['app'],
      description: 'Subscribe to an app’s push notifications',
      operationId: 'addSubscription',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              description: 'A serialized PushSubscription object',
              required: ['endpoint', 'keys'],
              properties: {
                endpoint: {
                  type: 'string',
                },
                keys: {
                  type: 'object',
                  required: ['p256dh', 'auth'],
                  properties: {
                    p256dh: { type: 'string' },
                    auth: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
      responses: {
        204: {
          description: 'The subscription has successfully been registered.',
        },
      },
      security: [{ app: ['openid'] }, {}],
    },
    patch: {
      tags: ['app'],
      description:
        'Subscribe to an app’s push notifications. If value isn’t set it will toggle between subscribing and unsubscribing.',
      operationId: 'updateSubscription',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['endpoint', 'resource', 'action'],
              properties: {
                endpoint: {
                  type: 'string',
                  format: 'uri',
                },
                resource: {
                  type: 'string',
                },
                action: {
                  type: 'string',
                  enum: ['create', 'update', 'delete'],
                },
                value: {
                  type: 'boolean',
                },
                resourceId: {
                  type: 'number',
                },
              },
            },
          },
        },
      },
      responses: {
        204: {
          description: 'The subscription has successfully been updated.',
        },
      },
      security: [{ app: ['openid'] }, {}],
    },
  },
  '/api/apps/{appId}/demoMembers': {
    parameters: [{ $ref: '#/components/parameters/appId' }],
    get: {
      tags: ['app'],
      description: 'Fetch all demo members of an app.',
      operationId: 'getDemoAppMembers',
      responses: {
        200: {
          description: 'The list of demo app members.',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/OrganizationMember',
                },
              },
            },
          },
        },
      },
    },
  },
  '/api/apps/{appId}/members': {
    parameters: [{ $ref: '#/components/parameters/appId' }],
    get: {
      tags: ['app'],
      description: 'Fetch all members of an app.',
      operationId: 'getAppMembers',
      responses: {
        200: {
          description: 'The list of app members.',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/OrganizationMember',
                },
              },
            },
          },
        },
      },
      security: [{ studio: [] }, { app: ['openid'] }],
    },
  },
  '/api/apps/{appId}/members/{userId}': {
    parameters: [
      { $ref: '#/components/parameters/appId' },
      {
        name: 'userId',
        in: 'path',
        description: 'The user ID of the member on which to perform an operation',
        required: true,
        schema: { $ref: '#/components/schemas/User/properties/id' },
      },
    ],
    get: {
      tags: ['app'],
      description: 'Get an app member.',
      operationId: 'getAppMember',
      responses: {
        200: {
          description: 'The resulting app member.',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/OrganizationMember',
              },
            },
          },
        },
      },
      security: [{ studio: [] }, { app: ['openid'] }],
    },
    post: {
      tags: ['app'],
      description: 'Assign an app role to a member.',
      operationId: 'setAppMember',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['role'],
              properties: {
                role: {
                  type: 'string',
                  description: 'The role to assign.',
                },
                properties: {
                  type: 'object',
                  additionalProperties: { type: 'string' },
                  description: 'Any additional properties that are allowed to be set for members.',
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'The resulting app member.',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/OrganizationMember',
              },
            },
          },
        },
      },
      security: [{ studio: [] }],
    },
    delete: {
      tags: ['app'],
      description: 'Delete an app member.',
      operationId: 'deleteAppMember',
      responses: {
        204: {
          description: 'The app member was deleted successfully.',
        },
      },
      security: [{ studio: [] }],
    },
  },
  '/api/apps/{appId}/members/{memberId}/picture': {
    parameters: [
      { $ref: '#/components/parameters/appId' },
      {
        name: 'memberId',
        in: 'path',
        description: 'The ID of the member on which to perform an operation',
        required: true,
        schema: { $ref: '#/components/schemas/User/properties/id' },
      },
    ],
    get: {
      tags: ['app'],
      description: `Get an app member’s profile picture.

This will return a 404 if the user has not uploaded one.`,
      operationId: 'getAppMemberPicture',
      responses: {
        200: {
          description: 'The profile picture of the app member.',
          content: {
            'image/png': {},
            'image/jpeg': {},
            'image/tiff': {},
            'image/webp': {},
          },
        },
      },
    },
  },
  '/api/apps/{appId}/ratings': {
    parameters: [{ $ref: '#/components/parameters/appId' }],
    get: {
      tags: ['app'],
      description: 'Fetch all ratings of an app.',
      operationId: 'getAppRatings',
      responses: {
        200: {
          description: 'The list of apps ratings.',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/Rating',
                },
              },
            },
          },
        },
      },
    },
    post: {
      tags: ['app'],
      description: 'Submit an app rating.',
      operationId: 'submitAppRating',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['rating'],
              properties: {
                rating: {
                  $ref: '#/components/schemas/Rating/properties/rating',
                },
                description: {
                  $ref: '#/components/schemas/Rating/properties/description',
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'The submitted app rating.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Asset/properties/id' },
            },
          },
        },
      },
      security: [{ studio: [] }],
    },
  },
  '/api/apps/{appId}/broadcast': {
    parameters: [{ $ref: '#/components/parameters/appId' }],
    post: {
      tags: ['app'],
      description: 'Broadcast a push notification to every subscriber of the app.',
      operationId: 'broadcast',
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
  '/api/apps/{appId}/snapshots': {
    parameters: [{ $ref: '#/components/parameters/appId' }],
    get: {
      tags: ['app'],
      description: 'Get a list of snapshots made of the app.',
      operationId: 'getAppSnapshots',
      responses: {
        200: {
          description: 'The available snapshots',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'number', description: 'The ID of the snapshot.' },
                    $created: {
                      type: 'string',
                      format: 'date-time',
                      description: 'The creation date of the snapshot.',
                    },
                    $author: {
                      type: 'object',
                      properties: {
                        id: { $ref: '#/components/schemas/User/properties/id' },
                        name: { $ref: '#/components/schemas/User/properties/name' },
                      },
                    },
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
  '/api/apps/{appId}/snapshots/{snapshotId}': {
    parameters: [
      { $ref: '#/components/parameters/appId' },
      {
        name: 'snapshotId',
        in: 'path',
        description: 'The ID of the snapshot',
        required: true,
        schema: { type: 'number', description: 'The ID of the snapshot.' },
      },
    ],
    get: {
      tags: ['app'],
      description: 'Get a single snapshot made of the app.',
      operationId: 'getAppSnapshot',
      responses: {
        200: {
          description: 'The snapshot',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: { type: 'integer', description: 'The ID of the snapshot.' },
                  yaml: { type: 'string', description: 'The app definition.' },
                  $created: {
                    type: 'string',
                    format: 'date-time',
                    description: 'The creation date of the snapshot.',
                  },
                  $author: {
                    type: 'object',
                    properties: {
                      id: { $ref: '#/components/schemas/User/properties/id' },
                      name: { $ref: '#/components/schemas/User/properties/name' },
                    },
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
  '/api/apps/{appId}/screenshots': {
    parameters: [{ $ref: '#/components/parameters/appId' }],
    post: {
      tags: ['app'],
      description: 'Add one or multiple screenshots of an app.',
      operationId: 'createAppScreenshot',
      requestBody: {
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              properties: {
                screenshots: {
                  type: 'array',
                  description: 'Screenshots to showcase in the store',
                  minItems: 1,
                  items: {
                    type: 'string',
                    format: 'binary',
                  },
                },
              },
            },
            encoding: {
              screenshots: {
                contentType: 'image/png,image/jpeg,image/tiff,image/webp',
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'The screenshots have been successfully created.',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'integer',
                  description: 'The ID of the newly created screenshot.',
                },
              },
            },
          },
        },
      },
      security: [{ studio: [] }, { cli: ['apps:write'] }],
    },
  },
  '/api/apps/{appId}/screenshots/{screenshotId}': {
    parameters: [
      { $ref: '#/components/parameters/appId' },
      { $ref: '#/components/parameters/screenshotId' },
    ],
    get: {
      tags: ['app'],
      description: 'Get a screenshot of an app.',
      operationId: 'getAppScreenshot',
      responses: {
        200: {
          description: 'The app screenshot',
        },
      },
    },
    delete: {
      tags: ['app'],
      description: 'Delete an existing screenshot.',
      operationId: 'deleteAppScreenshot',
      responses: {
        200: {
          description: 'The screenshot has been successfully deleted.',
        },
      },
      security: [{ studio: [] }, { cli: ['apps:write'] }],
    },
  },
  '/api/apps/{appId}/style/core': {
    parameters: [{ $ref: '#/components/parameters/appId' }],
    get: {
      tags: ['app'],
      description: 'Get the core style for this app.',
      operationId: 'getAppCoreStyle',
      responses: {
        200: {
          description: 'The core stylesheet associated with this app.',
          content: {
            'text/css': {},
          },
        },
      },
    },
  },
  '/api/apps/{appId}/style/shared': {
    parameters: [{ $ref: '#/components/parameters/appId' }],
    get: {
      tags: ['app'],
      description: 'Get the shared style for this app.',
      operationId: 'getAppSharedStyle',
      responses: {
        200: {
          description: 'The shared stylesheet associated with this app.',
          content: {
            'text/css': {},
          },
        },
      },
    },
  },
  '/api/apps/{appId}/style/block/@{organizationId}/{blockId}': {
    parameters: [
      { $ref: '#/components/parameters/appId' },
      { $ref: '#/components/parameters/organizationId' },
      { $ref: '#/components/parameters/blockId' },
    ],
    get: {
      tags: ['app'],
      description: 'Get the app style for a block.',
      operationId: 'getAppBlockStyle',
      responses: {
        200: {
          description: 'The stylesheet associated with this block for this app.',
          content: {
            'text/css': {},
          },
        },
      },
    },
    post: {
      tags: ['app'],
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
  '/api/apps/{appId}/teams': {
    parameters: [{ $ref: '#/components/parameters/appId' }],
    get: {
      tags: ['app'],
      description: 'Get a list of app teams.',
      operationId: 'getTeams',
      responses: {
        200: {
          description: 'The list of all teams.',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  description: 'An app team',
                  type: 'object',
                  properties: {
                    id: { type: 'number' },
                    name: { type: 'string' },
                    role: {
                      type: 'string',
                      description: 'The role of the user requesting the list of teams',
                      enum: Object.values(TeamRole),
                    },
                  },
                },
              },
            },
          },
        },
      },
      security: [{ studio: [] }, { app: ['teams:read'] }],
    },
    post: {
      tags: ['app'],
      description: 'Create a new team.',
      operationId: 'createTeam',
      requestBody: {
        description: 'The team to create.',
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name'],
              properties: {
                name: {
                  type: 'string',
                },
                annotations: {
                  type: 'object',
                  additionalProperties: { type: 'string' },
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'The created team',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  name: { type: 'string' },
                  role: {
                    type: 'string',
                    description: 'The role of the user who created the team',
                    enum: Object.values(TeamRole),
                  },
                },
              },
            },
          },
        },
      },
      security: [{ app: ['teams:write'] }, { studio: [] }, { cli: ['teams:write'] }],
    },
  },
  '/api/apps/{appId}/teams/{teamId}': {
    parameters: [
      { $ref: '#/components/parameters/appId' },
      {
        name: 'teamId',
        in: 'path',
        description: 'The ID of the team',
        required: true,
        schema: { type: 'number', readOnly: true },
      },
    ],
    get: {
      tags: ['app'],
      description: 'Fetch an existing team.',
      operationId: 'getTeam',
      responses: {
        200: {
          description: 'The requested team',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  name: { type: 'string' },
                  role: {
                    type: 'string',
                    description: 'The role of the user who requested the team',
                    enum: Object.values(TeamRole),
                  },
                },
              },
            },
          },
        },
      },
      security: [{ studio: [] }],
    },
    patch: {
      tags: ['app'],
      description: 'Update an existing team.',
      operationId: 'patchTeam',
      requestBody: {
        description: 'The team to update.',
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name'],
              properties: {
                name: {
                  type: 'string',
                },
                annotations: {
                  type: 'object',
                  additionalProperties: { type: 'string' },
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'The updated team',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  name: { type: 'string' },
                  role: {
                    type: 'string',
                    description: 'The role of the user who updated the team',
                    enum: Object.values(TeamRole),
                  },
                },
              },
            },
          },
        },
      },
      security: [{ studio: [] }, { cli: ['teams:write'] }],
    },
    delete: {
      tags: ['app'],
      description: 'Delete an existing team.',
      operationId: 'deleteTeam',
      responses: {
        204: { description: 'The team has successfully been deleted.' },
      },
      security: [{ studio: [] }, { cli: ['teams:write'] }],
    },
  },
  '/api/apps/{appId}/teams/{teamId}/members': {
    parameters: [
      { $ref: '#/components/parameters/appId' },
      {
        name: 'teamId',
        in: 'path',
        description: 'The ID of the team',
        required: true,
        schema: { type: 'number', readOnly: true },
      },
    ],
    get: {
      tags: ['app'],
      description: 'Fetch the members of a team and their roles within the team.',
      operationId: 'getTeamMembers',
      responses: {
        200: {
          description: 'The list of all members.',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/OrganizationMember',
                },
              },
            },
          },
        },
      },
      security: [{ studio: [] }, { app: ['teams:read'] }],
    },
    post: {
      tags: ['app'],
      description: 'Add an app member member to a team.',
      operationId: 'addTeamMember',
      requestBody: {
        description: 'The team to update.',
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['id'],
              properties: {
                id: { $ref: '#/components/schemas/User/properties/id' },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'The added member',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/OrganizationMember',
              },
            },
          },
        },
      },
      security: [{ studio: [] }, { app: ['teams:write'] }, { cli: ['teams:write'] }],
    },
  },
  '/api/apps/{appId}/teams/{teamId}/members/{memberId}': {
    parameters: [
      { $ref: '#/components/parameters/appId' },
      {
        name: 'teamId',
        in: 'path',
        description: 'The ID of the team',
        required: true,
        schema: { type: 'number', readOnly: true },
      },
      {
        name: 'memberId',
        in: 'path',
        description: 'The ID of the team member',
        required: true,
        schema: { $ref: '#/components/schemas/User/properties/id' },
      },
    ],
    get: {
      tags: ['app'],
      description: 'Get a certain team member from a team',
      operationId: 'getTeamMember',
      responses: {
        200: {
          description: 'The specified team member',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/OrganizationMember',
              },
            },
          },
        },
      },
    },
    put: {
      tags: ['app'],
      description: 'Update the role of a team member.',
      operationId: 'updateTeamMember',
      requestBody: {
        description: 'The team to update.',
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['role'],
              properties: {
                role: {
                  type: 'string',
                  enum: Object.values(TeamRole),
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'The updated member',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/OrganizationMember',
              },
            },
          },
        },
      },
      security: [{ studio: [] }, { app: [] }, { cli: ['teams:write'] }],
    },
    delete: {
      tags: ['app'],
      description: 'Remove a member from a team.',
      operationId: 'removeTeamMember',
      responses: {
        204: {
          description: 'The team member has been removed successfully.',
        },
      },
      security: [{ studio: [] }, { app: [] }, { cli: ['teams:write'] }],
    },
  },
  '/api/apps/{appId}/teams/{teamId}/invite': {
    parameters: [
      { $ref: '#/components/parameters/appId' },
      {
        name: 'teamId',
        in: 'path',
        description: 'The ID of the team',
        required: true,
        schema: { type: 'number', readOnly: true },
      },
    ],
    post: {
      tags: ['app'],
      description: 'Invite a new user to a team.',
      operationId: 'inviteTeamMember',
      requestBody: {
        description: 'The team invite to create.',
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email'],
              properties: {
                email: {
                  type: 'string',
                  format: 'email',
                  description: 'The email address of the user to invite.',
                },
                role: {
                  type: 'string',
                  enum: ['member', 'manager'],
                  description: 'The role to invite the user as.',
                  default: 'member',
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'The updated member',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/OrganizationMember',
              },
            },
          },
        },
      },
      security: [{ app: ['teams:write'] }],
    },
  },
  '/api/apps/{appId}/team/invite': {
    parameters: [{ $ref: '#/components/parameters/appId' }],
    get: {
      tags: ['app'],
      description: 'Get details of a team invite.',
      operationId: 'getTeamInvite',
      parameters: [
        {
          name: 'code',
          in: 'query',
          description: 'The ID code of the team invite',
          required: true,
          schema: { type: 'string', readOnly: true },
        },
      ],
      responses: {
        200: {
          description: 'The team invite',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/OrganizationMember',
              },
            },
          },
        },
      },
      security: [{ app: ['teams:read'] }],
    },
    post: {
      tags: ['app'],
      operationId: 'acceptTeamInvite',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                code: { type: 'string' },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'The created member',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/OrganizationMember',
              },
            },
          },
        },
      },
      security: [{ app: ['teams:read'] }],
    },
  },
  '/api/apps/{appId}/reseed': {
    parameters: [{ $ref: '#/components/parameters/appId' }],
    post: {
      tags: ['app'],
      operationId: 'reseedDemoApp',
      responses: {
        200: { description: 'The app has successfully been reseeded.' },
      },
      security: [{ studio: ['apps:write'] }],
    },
  },
};
