import { type OpenAPIV3 } from 'openapi-types';

const resourceContent: Record<string, OpenAPIV3.MediaTypeObject> = {
  'application/json': {
    schema: { $ref: '#/components/schemas/Resource' },
  },
  'text/csv': {
    schema: { type: 'string' },
  },
};

const etagResponseHeader: Record<string, OpenAPIV3.HeaderObject> = {
  ETag: {
    description: 'Strong validator for the current version of the resource.',
    schema: { type: 'string' },
  },
};

const ifMatchParameter: OpenAPIV3.ParameterObject = {
  name: 'If-Match',
  in: 'header',
  required: false,
  description:
    'Strong ETag from a prior response. The request only proceeds if the resource still matches; otherwise the server responds with 412 Precondition Failed.',
  schema: { type: 'string' },
};

const preconditionFailedResponse: OpenAPIV3.ResponseObject = {
  description:
    'The `If-Match` header did not match the current ETag of the resource. The caller should fetch the latest version and retry.',
};

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
        description:
          'The resource that matches the given id. Omits the `ETag` header on view responses.',
        content: resourceContent,
        headers: etagResponseHeader,
      },
    },
    security: [{ studio: [] }, { app: ['resources:manage'] }, { cli: ['resources:read'] }, {}],
  },
  put: {
    tags: ['common', 'app', 'resource'],
    description: 'Update an existing app resource.',
    operationId: 'updateAppResource',
    parameters: [ifMatchParameter],
    requestBody: {
      required: true,
      $ref: '#/components/requestBodies/resource',
    },
    responses: {
      200: {
        description: 'The updated resource.',
        content: resourceContent,
        headers: etagResponseHeader,
      },
      412: preconditionFailedResponse,
    },
    security: [{ studio: [] }, { app: ['resources:manage'] }, { cli: ['resources:write'] }, {}],
  },
  patch: {
    tags: ['common', 'app', 'resource'],
    description: 'Patch an existing app resource.',
    operationId: 'patchAppResource',
    parameters: [ifMatchParameter],
    requestBody: {
      required: true,
      $ref: '#/components/requestBodies/resource',
    },
    responses: {
      200: {
        description: 'The patched resource.',
        content: resourceContent,
        headers: etagResponseHeader,
      },
      412: preconditionFailedResponse,
    },
    security: [{ studio: [] }, { app: ['resources:manage'] }, { cli: ['resources:write'] }, {}],
  },
  delete: {
    tags: ['common', 'app', 'resource'],
    description: 'Delete an existing app resource.',
    operationId: 'deleteAppResource',
    parameters: [ifMatchParameter],
    responses: {
      204: {
        description: 'The app resource has been deleted successfully.',
      },
      412: preconditionFailedResponse,
    },
    security: [{ studio: [] }, { app: ['resources:manage'] }, { cli: ['resources:write'] }, {}],
  },
};
