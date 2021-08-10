import { OpenAPIV3 } from 'openapi-types';

export const resource: OpenAPIV3.RequestBodyObject = {
  description: 'A resource definition',
  content: {
    'application/json': {
      schema: {
        $ref: '#/components/schemas/Resource',
      },
    },
    'multipart/form-data': {
      schema: {
        type: 'object',
        required: ['resource'],
        description: 'A `multipart/form-data` representation of a resource.',
        additionalProperties: false,
        properties: {
          resource: { $ref: '#/components/schemas/Resource' },
          assets: {
            type: 'array',
            description: 'A list of assets that should be linked to the resource.',
            items: {
              type: 'string',
              format: 'binary',
            },
          },
        },
      },
    },
  },
};
