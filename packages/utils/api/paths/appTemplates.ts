import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
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
                // $ref: '#/components/schemas/AppDefinition/properties/name',
                // TODO: all
                type: 'string',
              },
              description: {
                type: 'string',
                // $ref: '#/components/schemas/AppDefinition/properties/description',
              },
              organizationId: {
                type: 'string',
                // $ref: '#/components/schemas/Organization/properties/id',
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
};
