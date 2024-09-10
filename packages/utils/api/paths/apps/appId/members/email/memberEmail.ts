import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [
    { $ref: '#/components/parameters/appId' },
    { $ref: '#/components/parameters/memberEmail' },
  ],
  delete: {
    tags: ['app', 'member'],
    description: 'Delete an app member by email.',
    operationId: 'deleteAppMemberByEmail',
    security: [{ app: [] }],
    responses: {
      204: {
        description: 'The app member was deleted successfully.',
      },
    },
  },
};
