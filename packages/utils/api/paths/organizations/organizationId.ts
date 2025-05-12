import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [{ $ref: '#/components/parameters/organizationId' }],
  get: {
    tags: ['main', 'organization'],
    description: 'Get a single organization.',
    operationId: 'getOrganization',
    responses: {
      200: {
        $ref: '#/components/responses/organization',
      },
    },
  },
  patch: {
    tags: ['main', 'organization'],
    description: 'Update an organization',
    operationId: 'patchOrganization',
    requestBody: {
      content: {
        'multipart/form-data': {
          schema: {
            type: 'object',
            properties: {
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
      200: { $ref: '#/components/responses/organization' },
    },
    security: [{ studio: [] }, { cli: ['organizations:write'] }],
  },
  delete: {
    tags: ['main', 'organization'],
    description: 'Delete an organization.',
    operationId: 'deleteOrganization',
    responses: {
      200: {
        description: 'successfully deleted organization',
      },
    },
    security: [{ studio: [] }, {}],
  },
};
