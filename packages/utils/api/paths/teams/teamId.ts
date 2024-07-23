import { type OpenAPIV3 } from 'openapi-types';

import { teamMemberRoles } from '../../../constants/index.js';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [
    {
      name: 'teamId',
      in: 'path',
      description: 'The ID of the team',
      required: true,
      schema: { type: 'number', readOnly: true },
    },
  ],
  get: {
    tags: ['common', 'team'],
    description: 'Fetch an existing team.',
    operationId: 'getTeam',
    responses: {
      200: {
        description: 'The requested team',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                name: { type: 'string' },
                role: {
                  type: 'string',
                  description: 'The role of the user who requested the team',
                  enum: Object.values(teamMemberRoles),
                },
              },
            },
          },
        },
      },
    },
    security: [{ studio: [] }],
  },
  patch: {
    tags: ['common', 'team'],
    description: 'Update an existing team.',
    operationId: 'patchTeam',
    requestBody: {
      description: 'The team to update.',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['name'],
            properties: {
              name: {
                type: 'string',
              },
              annotations: {
                type: 'object',
                additionalProperties: { type: 'string' },
              },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: 'The updated team',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                name: { type: 'string' },
                role: {
                  type: 'string',
                  description: 'The role of the user who updated the team',
                  enum: Object.values(teamMemberRoles),
                },
              },
            },
          },
        },
      },
    },
    security: [{ studio: [] }, { cli: ['teams:write'] }],
  },
  delete: {
    tags: ['common', 'team'],
    description: 'Delete an existing team.',
    operationId: 'deleteTeam',
    responses: {
      204: { description: 'The team has successfully been deleted.' },
    },
    security: [{ studio: [] }, { cli: ['teams:write'] }],
  },
};
