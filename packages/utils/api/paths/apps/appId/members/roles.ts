import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [{ $ref: '#/components/parameters/appId' }],
  get: {
    tags: ['app', 'member'],
    description: 'Fetch app accounts by roles.',
    operationId: 'getAppMembersByRoles',
    parameters: [{ $ref: '#/components/parameters/roles' }],
    security: [{ app: [] }],
    responses: {
      200: {
        description: 'The accounts that were fetched.',
      },
    },
  },
};
