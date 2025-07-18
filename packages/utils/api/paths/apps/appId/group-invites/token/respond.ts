import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [
    { $ref: '#/components/parameters/appId' },
    {
      name: 'token',
      in: 'path',
      description: 'The token of the invite.',
      required: true,
      schema: { type: 'string' },
    },
  ],
  post: {
    tags: ['group-invite'],
    description: 'Respond to a given invitation.',
    operationId: 'respondGroupInvite',
    requestBody: {
      description: `The response of the invitation.

        If response is true, user will join the app. If response is false, the user declines the invite and the invite is removed.`,
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['response'],
            properties: {
              response: {
                type: 'boolean',
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
    security: [{ app: [] }],
  },
};
