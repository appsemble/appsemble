import { type OpenAPIV3 } from 'openapi-types';

export const paths: OpenAPIV3.PathsObject = {
  '/api/apps/{appId}/team-invites': {
    parameters: [{ $ref: '#/components/parameters/appId' }],
    get: {
      tags: ['app', 'team', 'invite'],
      description: 'Get details of a team invite.',
      operationId: 'getAppTeamInvite',
      parameters: [
        {
          name: 'code',
          in: 'query',
          description: 'The ID code of the team invite',
          required: true,
          schema: { type: 'string', readOnly: true },
        },
      ],
      responses: {
        200: {
          description: 'The team invite',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/OrganizationMember',
              },
            },
          },
        },
      },
      security: [{ app: ['teams:read'] }],
    },
    post: {
      tags: ['app', 'team', 'invite'],
      operationId: 'acceptAppTeamInvite',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                code: { type: 'string' },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'The created member',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/OrganizationMember',
              },
            },
          },
        },
      },
      security: [{ app: ['teams:read'] }],
    },
  },
};
