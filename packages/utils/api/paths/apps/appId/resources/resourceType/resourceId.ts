import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [
    { $ref: '#/components/parameters/appId' },
    { $ref: '#/components/parameters/resourceType' },
    { $ref: '#/components/parameters/resourceId' },
    { $ref: '#/components/parameters/selectedGroupId' },
  ],
  get: {
    tags: ['common', 'app', 'resource'],
    parameters: [
      { $ref: '#/components/parameters/view' },
      {
        name: '$own',
        schema: { type: 'boolean' },
        description: 'If the resources created by the authenticated app member should be included',
        in: 'query',
      },
    ],
    description: 'Get a single app resource.',
    operationId: 'getAppResourceById',
    responses: {
      200: {
        description: 'The resource that matches the given id.',
        $ref: '#/components/responses/resource',
      },
    },
    security: [{ studio: [] }, { app: ['resources:manage'] }, { cli: ['resources:read'] }, {}],
  },
  put: {
    tags: ['common', 'app', 'resource'],
    description: 'Update an existing app resource.',
    operationId: 'updateAppResource',
    requestBody: {
      required: true,
      $ref: '#/components/requestBodies/resource',
    },
    responses: {
      200: {
        description: 'The updated resource.',
        $ref: '#/components/responses/resource',
      },
    },
    security: [{ studio: [] }, { app: ['resources:manage'] }, { cli: ['resources:write'] }, {}],
  },
  patch: {
    tags: ['common', 'app', 'resource'],
    description: 'Patch an existing app resource.',
    operationId: 'patchAppResource',
    requestBody: {
      required: true,
      $ref: '#/components/requestBodies/resource',
    },
    responses: {
      200: {
        description: 'The patched resource.',
        $ref: '#/components/responses/resource',
      },
    },
    security: [{ studio: [] }, { app: ['resources:manage'] }, { cli: ['resources:write'] }, {}],
  },
  delete: {
    tags: ['common', 'app', 'resource'],
    description: 'Delete an existing app resource.',
    operationId: 'deleteAppResource',
    responses: {
      204: {
        description: 'The app resource has been deleted successfully.',
        $ref: '#/components/responses/resource',
      },
    },
    security: [{ studio: [] }, { app: ['resources:manage'] }, { cli: ['resources:write'] }, {}],
  },
};
