import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [{ $ref: '#/components/parameters/appId' }],
  get: {
    tags: ['main', 'app', 'rating'],
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
    tags: ['main', 'app', 'rating'],
    description: 'Submit an app rating.',
    operationId: 'createAppRating',
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
};
