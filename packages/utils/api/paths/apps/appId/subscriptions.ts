import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [{ $ref: '#/components/parameters/appId' }],
  get: {
    tags: ['main', 'app', 'subscription'],
    parameters: [{ $ref: '#/components/parameters/endpoint' }],
    description: 'Fetch all subscription settings of an app.',
    operationId: 'getAppSubscription',
    responses: {
      200: {
        description: 'The subscription settings.',
        $ref: '#/components/responses/subscriptions',
      },
    },
  },
  post: {
    tags: ['main', 'app', 'subscription'],
    description: 'Subscribe to an app’s push notifications',
    operationId: 'createAppSubscription',
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
    security: [{ studio: [] }, { app: ['openid'] }, {}],
  },
  patch: {
    tags: ['main', 'app', 'subscription'],
    description:
      'Subscribe to an app’s push notifications. If value isn’t set it will toggle between subscribing and unsubscribing.',
    operationId: 'updateAppSubscription',
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
    security: [{ studio: [] }, { app: ['openid'] }, {}],
  },
};
