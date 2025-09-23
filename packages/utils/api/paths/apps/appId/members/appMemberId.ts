import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [
    { $ref: '#/components/parameters/appId' },
    {
      name: 'appMemberId',
      in: 'path',
      description: 'The id of the app member on which to perform an operation',
      required: true,
      schema: { $ref: '#/components/schemas/AppMember/properties/id' },
    },
  ],
  delete: {
    tags: ['common', 'app-member'],
    description: 'Delete an app member.',
    operationId: 'deleteAppMember',
    parameters: [{ $ref: '#/components/parameters/selectedGroupId' }],
    responses: {
      204: {
        description: 'The app member was deleted successfully.',
      },
    },
    security: [{ studio: [] }, { app: ['resources:manage'] }, {}],
  },
};
