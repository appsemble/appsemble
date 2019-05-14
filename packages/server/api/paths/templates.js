export default {
  '/api/templates': {
    get: {
      tags: ['template'],
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
                  schema: {
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
      },
    },
    post: {
      tags: ['template'],
      description: 'Register a new app using a template.',
      operationId: 'createTemplateApp',
      requestBody: {
        description: 'The template to use for app creation.',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['template', 'organizationId'],
              properties: {
                template: {
                  type: 'string',
                  description: 'The name of the template.',
                },
                name: {
                  $ref: '#/components/schemas/App/properties/name',
                },
                description: {
                  $ref: '#/components/schemas/App/properties/description',
                },
                organizationId: {
                  $ref: '#/components/schemas/Organization/properties/id',
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
      security: [{ apiUser: ['apps:write'] }],
    },
  },
};
