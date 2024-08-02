import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [
    {
      name: 'token',
      in: 'path',
      description: 'The token of the invite.',
      required: true,
      schema: { type: 'string' },
    },
  ],
  get: {
    tags: ['main', 'organization', 'invite'],
    description: 'Fetch information about an invite.',
    operationId: 'getOrganizationInvite',
    responses: {
      200: {
        description: 'An invite response',
        $ref: '#/components/responses/invite',
      },
    },
  },
};
