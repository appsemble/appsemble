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
        headers: {
          ETag: {
            description:
              'The strong validator identifying the current version of the resource. Echo it back via `If-Match` on PUT/PATCH to perform a conditional write. Omitted on view responses.',
            schema: { type: 'string' },
          },
        },
      },
    },
    security: [{ studio: [] }, { app: ['resources:manage'] }, { cli: ['resources:read'] }, {}],
  },
  put: {
    tags: ['common', 'app', 'resource'],
    description: 'Update an existing app resource.',
    operationId: 'updateAppResource',
    parameters: [
      {
        name: 'If-Match',
        in: 'header',
        required: false,
        description:
          'Strong ETag from a prior response. The write only proceeds if the resource still matches; otherwise the server responds with 412 Precondition Failed.',
        schema: { type: 'string' },
      },
    ],
    requestBody: {
      required: true,
      $ref: '#/components/requestBodies/resource',
    },
    responses: {
      200: {
        description: 'The updated resource.',
        $ref: '#/components/responses/resource',
        headers: {
          ETag: {
            description: 'The strong validator for the new version of the resource.',
            schema: { type: 'string' },
          },
        },
      },
      412: {
        description:
          'The `If-Match` header did not match the current ETag of the resource. The caller should fetch the latest version and retry.',
      },
    },
    security: [{ studio: [] }, { app: ['resources:manage'] }, { cli: ['resources:write'] }, {}],
  },
  patch: {
    tags: ['common', 'app', 'resource'],
    description: 'Patch an existing app resource.',
    operationId: 'patchAppResource',
    parameters: [
      {
        name: 'If-Match',
        in: 'header',
        required: false,
        description:
          'Strong ETag from a prior response. The patch only proceeds if the resource still matches; otherwise the server responds with 412 Precondition Failed.',
        schema: { type: 'string' },
      },
    ],
    requestBody: {
      required: true,
      $ref: '#/components/requestBodies/resource',
    },
    responses: {
      200: {
        description: 'The patched resource.',
        $ref: '#/components/responses/resource',
        headers: {
          ETag: {
            description: 'The strong validator for the new version of the resource.',
            schema: { type: 'string' },
          },
        },
      },
      412: {
        description:
          'The `If-Match` header did not match the current ETag of the resource. The caller should fetch the latest version and retry.',
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
