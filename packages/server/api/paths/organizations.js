export default {
  '/api/organizations/{id}/style/shared': {
    parameters: [
      {
        name: 'id',
        in: 'path',
        description: 'The id of the organization.',
      },
    ],
    get: {
      tags: ['organization'],
      description: 'Get the shared style for this organization.',
      operationId: 'getOrganizationSharedStyle',
      responses: {
        200: {
          description: 'The shared stylesheet associated with this organization.',
          content: {
            'text/css': {},
          },
        },
      },
    },
    post: {
      tags: ['organization'],
      description: 'Upload a shared stylesheet for this organization.',
      operationId: 'setOrganizationSharedStyle',
      requestBody: {
        content: {
          'multipart/form-data': {
            schema: {
              required: ['style'],
              properties: {
                style: {
                  description: 'The new organization shared stylesheet.',
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
          description: 'The shared style has been updated succesfully.',
        },
      },
      security: [{ apiUser: ['organizations:style'] }],
    },
  },
  '/api/organizations/{id}/style/core': {
    parameters: [
      {
        name: 'id',
        in: 'path',
        description: 'The id of the organization.',
      },
    ],
    get: {
      tags: ['organization'],
      description: 'Get the core style for this organization.',
      operationId: 'getOrganizationCoreStyle',
      responses: {
        200: {
          description: 'The shared stylesheet associated with this organization.',
          content: {
            'text/css': {},
          },
        },
      },
    },
    post: {
      tags: ['organization'],
      description: 'Upload a core stylesheet for this organization.',
      operationId: 'setOrganizationCoreStyle',
      requestBody: {
        content: {
          'multipart/form-data': {
            schema: {
              required: ['style'],
              properties: {
                style: {
                  description: 'The new organization shared stylesheet.',
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
          description: 'The shared style has been updated succesfully.',
        },
      },
      security: [{ apiUser: ['organizations:style'] }],
    },
  },
  '/api/organizations/{organizationId}/style/block/{organizationName}/{blockName}': {
    parameters: [
      {
        name: 'organizationId',
        in: 'path',
        description: 'The id of the organization.',
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
      tags: ['organization'],
      description: 'Get the organization style for a block.',
      operationId: 'getOrganizationBlockStyle',
      responses: {
        200: {
          description: 'The stylesheet associated with this block for this organization.',
          content: {
            'text/css': {},
          },
        },
      },
    },
    post: {
      tags: ['organization'],
      description: 'Upload a block stylesheet for this organization.',
      operationId: 'setOrganizationBlockStyle',
      requestBody: {
        content: {
          'multipart/form-data': {
            schema: {
              required: ['style'],
              properties: {
                style: {
                  description: 'The new organization block stylesheet.',
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
      security: [{ apiUser: ['organizations:style'] }],
    },
  },
};
