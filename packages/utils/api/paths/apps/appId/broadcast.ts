import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
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
};
