import { type OpenAPIV3 } from 'openapi-types';

import { paths as membersPaths } from './members/index.js';
import { paths as teamIdPaths } from './teamId.js';
import { TeamRole } from '../../../../../constants/index.js';

export const paths: OpenAPIV3.PathsObject = {
  ...teamIdPaths,
  ...membersPaths,
  '/api/apps/{appId}/teams': {
    parameters: [{ $ref: '#/components/parameters/appId' }],
    get: {
      tags: ['common', 'app', 'team'],
      description: 'Get a list of app teams.',
      operationId: 'getAppTeams',
      responses: {
        200: {
          description: 'The list of all teams.',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  description: 'An app team',
                  type: 'object',
                  properties: {
                    id: { type: 'number' },
                    name: { type: 'string' },
                    role: {
                      type: 'string',
                      description: 'The role of the user requesting the list of teams',
                      enum: Object.values(TeamRole),
                    },
                  },
                },
              },
            },
          },
        },
      },
      security: [{ studio: [] }, { app: ['teams:read'] }],
    },
    post: {
      tags: ['common', 'app', 'team'],
      description: 'Create a new team.',
      operationId: 'createAppTeam',
      requestBody: {
        description: 'The team to create.',
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
        201: {
          description: 'The created team',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  name: { type: 'string' },
                  role: {
                    type: 'string',
                    description: 'The role of the user who created the team',
                    enum: Object.values(TeamRole),
                  },
                },
              },
            },
          },
        },
      },
      security: [{ app: ['teams:write'] }, { studio: [] }, { cli: ['teams:write'] }],
    },
  },
};
