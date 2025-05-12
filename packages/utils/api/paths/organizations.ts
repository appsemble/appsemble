import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  get: {
    tags: ['main', 'organization'],
    description: 'Fetch the list of organizations.',
    operationId: 'getOrganizations',
    responses: {
      200: {
        description: 'The list of of organizations',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Organization',
              },
            },
          },
        },
      },
    },
  },
  post: {
    tags: ['main', 'organization'],
    description: 'Create a new organization.',
    operationId: 'createOrganization',
    requestBody: {
      description: 'The organization to create',
      required: true,
      content: {
        'multipart/form-data': {
          schema: {
            type: 'object',
            properties: {
              id: {
                $ref: '#/components/schemas/Organization/properties/id',
              },
              name: {
                $ref: '#/components/schemas/Organization/properties/name',
              },
              description: {
                $ref: '#/components/schemas/Organization/properties/description',
              },
              email: {
                $ref: '#/components/schemas/Organization/properties/email',
              },
              website: {
                $ref: '#/components/schemas/Organization/properties/website',
              },
              preferredPaymentProvider: {
                $ref: '#/components/schemas/Organization/properties/preferredPaymentProvider',
              },
              vatIdNumber: {
                $ref: '#/components/schemas/Organization/properties/vatIdNumber',
              },
              streetName: {
                $ref: '#/components/schemas/Organization/properties/streetName',
              },
              houseNumber: {
                $ref: '#/components/schemas/Organization/properties/houseNumber',
              },
              city: {
                $ref: '#/components/schemas/Organization/properties/city',
              },
              zipCode: {
                $ref: '#/components/schemas/Organization/properties/zipCode',
              },
              countryCode: {
                $ref: '#/components/schemas/Organization/properties/countryCode',
              },
              invoiceReference: {
                $ref: '#/components/schemas/Organization/properties/invoiceReference',
              },
              icon: {
                type: 'string',
                format: 'binary',
                description: 'The organization icon.',
              },
            },
          },
          encoding: {
            icon: {
              contentType: 'image/png,image/jpeg,image/tiff,image/webp',
            },
          },
        },
      },
    },
    responses: {
      201: {
        $ref: '#/components/responses/organization',
      },
    },
    security: [{ studio: [] }, { cli: ['organizations:write'] }],
  },
};
