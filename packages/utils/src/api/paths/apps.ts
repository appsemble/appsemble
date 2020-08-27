import type { OpenAPIV3 } from 'openapi-types';

export const paths: OpenAPIV3.PathsObject = {
  '/api/apps': {
    post: {
      tags: ['app'],
      description: 'Create a new app',
      operationId: 'createApp',
      requestBody: {
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              required: ['OrganizationId', 'definition'],
              properties: {
                definition: {
                  $ref: '#/components/schemas/App/properties/definition',
                },
                domain: {
                  $ref: '#/components/schemas/App/properties/domain',
                },
                path: {
                  $ref: '#/components/schemas/App/properties/path',
                },
                private: {
                  $ref: '#/components/schemas/App/properties/private',
                },
                template: {
                  $ref: '#/components/schemas/App/properties/template',
                },
                yaml: {
                  type: 'string',
                  format: 'binary',
                  description: 'The original YAML definition used to define the app.',
                },
                OrganizationId: {
                  $ref: '#/components/schemas/App/properties/OrganizationId',
                },
                icon: {
                  type: 'string',
                  format: 'binary',
                  description: 'The app icon.',
                },
                style: {
                  type: 'string',
                  format: 'binary',
                  description: 'The custom style to apply to the core app.',
                },
                sharedStyle: {
                  type: 'string',
                  format: 'binary',
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
              },
            },
            encoding: {
              style: { contentType: 'text/css' },
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
  '/api/apps/me': {
    get: {
      tags: ['app'],
      description: 'Get all apps that are editable by the user.',
      operationId: 'queryMyApps',
      responses: {
        200: {
          description: 'The list of all editable apps.',
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
      security: [{ studio: [] }],
    },
  },
  '/api/apps/{appId}': {
    parameters: [{ $ref: '#/components/parameters/appId' }],
    get: {
      tags: ['app'],
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
                definition: {
                  $ref: '#/components/schemas/App/properties/definition',
                },
                domain: {
                  $ref: '#/components/schemas/App/properties/domain',
                },
                path: {
                  $ref: '#/components/schemas/App/properties/path',
                },
                private: {
                  $ref: '#/components/schemas/App/properties/private',
                },
                template: {
                  $ref: '#/components/schemas/App/properties/template',
                },
                yaml: {
                  type: 'string',
                  format: 'binary',
                  description: 'The original YAML definition used to define the app.',
                },
                icon: {
                  type: 'string',
                  format: 'binary',
                  description: 'The app icon.',
                },
                style: {
                  type: 'string',
                  format: 'binary',
                  description: 'The custom style to apply to the core app.',
                },
                sharedStyle: {
                  type: 'string',
                  format: 'binary',
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
              },
            },
            encoding: {
              style: { contentType: 'text/css' },
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
      security: [{ studio: [] }],
    },
  },
  '/api/apps/{appId}/icon': {
    parameters: [{ $ref: '#/components/parameters/appId' }],
    get: {
      tags: ['app'],
      description: 'Get the current app Icon.',
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
      security: [{ studio: [] }, {}],
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
      security: [{ studio: [] }, {}],
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
                  $ref: '#/components/schemas/Member',
                },
              },
            },
          },
        },
      },
    },
  },
  '/api/apps/{appId}/members/{memberId}': {
    parameters: [
      { $ref: '#/components/parameters/appId' },
      {
        name: 'memberId',
        in: 'path',
        description: 'The ID of the member on which to perform an operation',
        required: true,
        schema: { $ref: '#/components/schemas/Member/properties/id' },
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
                $ref: '#/components/schemas/Member',
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
                $ref: '#/components/schemas/Member',
              },
            },
          },
        },
      },
      security: [{ studio: [] }],
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
          'multipart/form-data': {
            schema: {
              type: 'object',
              required: ['style'],
              properties: {
                style: {
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
          description: 'The block style has been updated succesfully.',
        },
      },
      security: [{ studio: [] }, { cli: ['apps:write'] }],
    },
  },
};
