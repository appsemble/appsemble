import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [
    { $ref: '#/components/parameters/appId' },
    {
      name: 'appMemberId',
      in: 'path',
      description: 'The id of the app member on which to perform an operation',
      required: true,
      schema: { $ref: '#/components/schemas/AppMember/properties/id' },
    },
  ],
  delete: {
    tags: ['main', 'app-member'],
    description:
      'Reset the TOTP of an app member, so they can enroll again with a new authenticator.',
    operationId: 'resetAppMemberTotp',
    responses: {
      204: {
        description: 'The TOTP of the app member was reset.',
      },
    },
    security: [{ studio: [] }],
  },
};
