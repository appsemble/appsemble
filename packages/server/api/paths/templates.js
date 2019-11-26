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
              required: ['templateId', 'organizationId'],
              properties: {
                templateId: {
                  type: 'number',
                  description: 'The ID of the template.',
                },
                name: {
                  $ref: '#/components/schemas/App/properties/definition/properties/name',
                },
                description: {
                  $ref: '#/components/schemas/App/properties/definition/properties/description',
                },
                organizationId: {
                  $ref: '#/components/schemas/Organization/properties/id',
                },
                resources: {
                  type: 'boolean',
                  description: 'Include example resources.',
                },
                private: {
                  $ref: '#/components/schemas/App/properties/private',
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
