import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [{ $ref: '#/components/parameters/organizationId' }],
  post: {
    tags: ['organization'],
    description: 'Request to resend an invitation.',
    operationId: 'resendOrganizationInvite',
    requestBody: {
      description: 'The email of the person to resend the invitation to.',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['email'],
            properties: {
              email: {
                type: 'string',
              },
            },
          },
        },
      },
    },
    responses: {
      204: {
        description: 'The invite has been sent.',
      },
    },
    security: [{ studio: [] }],
  },
};