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
              required: ['app', 'organizationId'],
              properties: {
                app: { $ref: '#/components/schemas/App' },
                organizationId: {
                  description: 'The organization for which the app is made.',
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
            encoding: {
              style: { contentType: 'text/css' },
              sharedStyle: { contentType: 'text/css' },
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
      security: [
        {
          apiUser: ['apps:write'],
        },
      ],
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
      security: [{ apiUser: ['apps:read', 'apps:write'] }],
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
      security: [
        {
          apiUser: ['apps:write'],
        },
      ],
    },
  },
  '/api/apps/{id}': {
    parameters: [
      {
        name: 'id',
        in: 'path',
        description: 'The id of the app to perform the action on.',
        schema: { type: 'integer' },
      },
    ],
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
              required: ['app'],
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
              },
            },
            encoding: {
              style: { contentType: 'text/css' },
              sharedStyle: { contentType: 'text/css' },
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
      security: [{ apiUser: ['apps:read', 'apps:write'] }],
    },
  },
  '/api/apps/{id}/icon': {
    parameters: [
      {
        name: 'id',
        in: 'path',
        description: 'The id of the app on whose icon to perform an action.',
        schema: { type: 'integer' },
      },
    ],
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
    post: {
      tags: ['app'],
      description: `Change the app icon.

        If no icon has been specified, the Appsemble icon will be served.
      `,
      operationId: 'setAppIcon',
      requestBody: {
        description: 'The new app icon.',
        content: {
          'image/png': {},
          'image/jpg': {},
          'image/svg+xml': {},
          'image/tiff': {},
          'image/webp': {},
        },
      },
      responses: {
        204: {
          description: 'The icon has been updated succesfully.',
        },
      },
      security: [{ apiUser: ['apps:read'] }],
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
      security: [{ apiUser: ['apps:read'] }],
    },
  },
  '/api/apps/{id}/style/core': {
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

  '/api/apps/{id}/style/shared': {
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
  '/api/apps/{appId}/style/block/{organizationName}/{blockName}': {
    parameters: [
      {
        name: 'appId',
        in: 'path',
        description: 'The id of the app.',
        schema: { type: 'integer' },
      },
      {
        name: 'organizationName',
        in: 'path',
        description: 'The organization name of the block.',
      },
      {
        name: 'blockName',
        in: 'path',
        description: 'The name of the block.',
      },
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
    },
  },
};
