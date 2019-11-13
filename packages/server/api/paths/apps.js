export default {
  '/api/apps': {
    post: {
      tags: ['app'],
      description: 'Create a new app',
      operationId: 'createApp',
      requestBody: {
        content: {
          'multipart/form-data': {
            schema: {
              required: ['app'],
              properties: {
                app: {
                  required: ['OrganizationId', 'private'],
                  $ref: '#/components/schemas/App',
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
      security: [{ apiUser: ['apps:write'] }],
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
      security: [{ apiUser: ['apps:read'] }],
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
    },
    put: {
      tags: ['app'],
      description: 'Update an existing app',
      operationId: 'updateApp',
      requestBody: {
        content: {
          'multipart/form-data': {
            schema: {
              required: ['app', 'style', 'sharedStyle', 'yaml', 'icon'],
              properties: {
                app: {
                  $ref: '#/components/schemas/App',
                  required: ['definition', 'private', 'path'],
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
              },
            },
            encoding: {
              style: { contentType: 'text/css' },
              sharedStyle: { contentType: 'text/css' },
              icon: {
                contentType: 'image/png,image/jpg,image/svg+xml,image/tiff,image/webp',
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
      security: [{ apiUser: ['apps:write'] }],
    },
    patch: {
      tags: ['app'],
      description: 'Update parts of an existing app',
      operationId: 'patchApp',
      requestBody: {
        content: {
          'multipart/form-data': {
            schema: {
              properties: {
                app: { $ref: '#/components/schemas/App' },
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
              },
            },
            encoding: {
              style: { contentType: 'text/css' },
              sharedStyle: { contentType: 'text/css' },
              icon: {
                contentType: 'image/png,image/jpg,image/svg+xml,image/tiff,image/webp',
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
      security: [{ apiUser: ['apps:write'] }],
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
      security: [{ apiUser: ['apps:write'] }],
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
            'image/jpg': {},
            'image/svg+xml': {},
            'image/tiff': {},
            'image/webp': {},
          },
        },
      },
    },
    delete: {
      tags: ['app'],
      description: `Delete the app icon from the database.

        When the app icon has been deleted, the Appsemble icon will be served.
      `,
      operationId: 'deleteAppIcon',
      responses: {
        204: {
          description: 'The icon has been deleted succesfully.',
        },
      },
      security: [{ apiUser: ['apps:write'] }],
    },
  },
  '/api/apps/{appId}/subscriptions': {
    parameters: [{ $ref: '#/components/parameters/appId' }],
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
                expirationTime: {
                  oneOf: [{ enum: [null] }, { type: 'number' }],
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
      security: [{ apiUser: ['apps:write'] }],
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
      security: [{ apiUser: ['apps:write'] }],
    },
  },
};
