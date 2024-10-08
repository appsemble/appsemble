import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [{ $ref: '#/components/parameters/appId' }],
  delete: {
    tags: ['main', 'app', 'resource'],
    description: 'Delete all app seed resources.',
    operationId: 'deleteAppSeedResources',
    responses: {
      204: {
        description: 'The app resources have been deleted successfully.',
      },
    },
    security: [{ cli: ['resources:write'] }, {}],
  },
};
