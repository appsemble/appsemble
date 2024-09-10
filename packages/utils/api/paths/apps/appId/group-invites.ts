import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [{ $ref: '#/components/parameters/appId' }],
  get: {
    tags: ['app', 'group', 'invite'],
    description: 'Get details of a group invite.',
    operationId: 'getAppGroupInvite',
    parameters: [
      {
        name: 'code',
        in: 'query',
        description: 'The ID code of the group invite',
        required: true,
        schema: { type: 'string', readOnly: true },
      },
    ],
    responses: {
      200: {
        description: 'The group invite',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/OrganizationMember',
            },
          },
        },
      },
    },
    security: [{ app: ['groups:read'] }],
  },
  post: {
    tags: ['app', 'group', 'invite'],
    operationId: 'acceptAppGroupInvite',
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
    security: [{ app: ['groups:read'] }],
  },
};
