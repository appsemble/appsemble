import { type OpenAPIV3 } from 'openapi-types';

export const paths: OpenAPIV3.PathsObject = {
  '/api/organizations/{organizationId}/invites/{inviteToken}/respond': {
    parameters: [
      { $ref: '#/components/parameters/organizationId' },
      {
        name: 'inviteToken',
        in: 'path',
        description: 'The token of the invite.',
        required: true,
        schema: { type: 'string' },
      },
    ],
    post: {
      tags: ['main', 'organization', 'invite'],
      description: 'Respond to a given invitation.',
      operationId: 'respondOrganizationInvite',
      requestBody: {
        description: `The response of the invitation.

        If response is true, user will join the organization. If response is false, the user declines the invite and the invite is removed.`,
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['response', 'token'],
              properties: {
                response: {
                  type: 'boolean',
                },
                token: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
      responses: {
        204: {
          description: 'The response has been processed.',
        },
      },
      security: [{ studio: [] }],
    },
  },
};
