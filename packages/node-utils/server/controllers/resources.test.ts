import {
  type App,
  type AppDefinition,
  type AppMessages,
  type Resource,
  type ResourceDefinition,
  type ResourceView,
} from '@appsemble/types';
import { defaultLocale, remap } from '@appsemble/utils';
import { type DefaultContext, type DefaultState, type ParameterizedContext } from 'koa';
import { type PathParams, type QueryParams } from 'koas-parameters';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import {
  createCountResources,
  createCreateResource,
  createGetResourceById,
  createQueryResources,
} from './resources.js';
import { getRemapperContext } from '../../app.js';
import { getResourceDefinition } from '../../resource.js';
import {
  type CreateAppResourcesWithAssetsParams,
  type GetAppMessagesParams,
  type GetAppParams,
  type GetAppResourceParams,
  type GetAppResourcesParams,
  type GetAppSubEntityParams,
  type Options,
  type ParsedQuery,
  type ParseQueryParams,
  type UtilsUser,
  type VerifyResourceActionPermissionParams,
} from '../types.js';

let mockGetApp: Mock<[GetAppParams], Promise<App>>;
let mockGetAppResources: Mock<[GetAppResourcesParams], Promise<Resource[]>>;
let mockGetAppResource: Mock<[GetAppResourceParams], Promise<Resource>>;
let mockVerifyResourceActionPermission: Mock<
  [VerifyResourceActionPermissionParams],
  Promise<Record<string, any>>
>;
let mockParseQuery: Mock<[ParseQueryParams], ParsedQuery>;
let mockGetAppUrl: Mock<[GetAppSubEntityParams], Promise<URL>>;
let mockGetAppMessages: Mock<[GetAppMessagesParams], Promise<AppMessages[]>>;
let mockCreateAppResourcesWithAssets: Mock<
  [CreateAppResourcesWithAssetsParams],
  Promise<Resource[]>
>;

let mockCtx: ParameterizedContext<DefaultState, DefaultContext>;
let mockCtxIs: Mock<[], string>;

describe('createQueryResources', () => {
  beforeEach(() => {
    mockGetApp = vi.fn();
    mockGetAppResources = vi.fn();
    mockVerifyResourceActionPermission = vi.fn();
    mockParseQuery = vi.fn();
    mockGetAppUrl = vi.fn();
    mockGetAppMessages = vi.fn();

    mockCtx = {
      pathParams: { appId: 1, resourceType: 'mockResourceType' } as PathParams,
      queryParams: { $select: 'field1, field2', $skip: 0, $top: 10 } as QueryParams,
      user: { id: 'mockUserId', name: 'John Doe', primaryEmail: 'john@example.com' } as UtilsUser,
    } as ParameterizedContext<DefaultState, DefaultContext>;
  });

  it('should fetch app and resources with correct parameters', async () => {
    const mockApp = {
      id: 1,
      definition: {
        resources: {
          mockResourceType: { id: 'id', schema: {} },
        } as Record<string, ResourceDefinition>,
      } as AppDefinition,
    } as App;
    const mockResources = [{ id: 1 }, { id: 2 }] as Resource[];
    const mockParsedQuery = {
      order: [
        ['mockField1', 'mockOrderAsc'],
        ['mockField2', 'mockOrderDesc'],
      ],
      where: { mockField: 'mockValue' },
    } as ParsedQuery;

    mockGetApp.mockResolvedValue(mockApp);
    mockGetAppResources.mockResolvedValue(mockResources);
    mockParseQuery.mockReturnValue(mockParsedQuery);

    const middleware = createQueryResources({
      getApp: mockGetApp as (params: GetAppParams) => Promise<App>,
      getAppResources: mockGetAppResources as (
        params: GetAppResourcesParams,
      ) => Promise<Resource[]>,
      verifyResourceActionPermission: mockVerifyResourceActionPermission as (
        params: VerifyResourceActionPermissionParams,
      ) => Promise<Record<string, any>>,
      parseQuery: mockParseQuery as (params: ParseQueryParams) => ParsedQuery,
    } as Options);

    await middleware(mockCtx, vi.fn());

    expect(mockGetApp).toHaveBeenCalledWith(
      expect.objectContaining({
        context: expect.objectContaining({
          pathParams: expect.objectContaining({ appId: 1 }),
        }),
        query: expect.objectContaining({ where: { id: 1 } }),
      }),
    );

    expect(mockGetAppResources).toHaveBeenCalledWith(
      expect.objectContaining({
        app: {
          definition: {
            resources: {
              mockResourceType: {
                id: 'id',
                schema: {},
              },
            },
          },
          id: 1,
        },
        context: expect.objectContaining({
          pathParams: expect.objectContaining({
            appId: 1,
            resourceType: 'mockResourceType',
          }),
          queryParams: expect.objectContaining({
            $select: 'field1, field2',
            $skip: 0,
            $top: 10,
          }),
          user: expect.objectContaining({
            id: 'mockUserId',
            name: 'John Doe',
            primaryEmail: 'john@example.com',
          }),
        }),
        findOptions: expect.objectContaining({
          attributes: ['field1', 'field2'],
          limit: 10,
          offset: 0,
          order: expect.arrayContaining([
            ['mockField1', 'mockOrderAsc'],
            ['mockField2', 'mockOrderDesc'],
          ]),
          where: expect.objectContaining({
            and: expect.arrayContaining([
              expect.objectContaining({ mockField: 'mockValue' }),
              expect.objectContaining({
                AppId: 1,
                expires: expect.objectContaining({
                  or: expect.arrayContaining([{ gt: expect.any(Date) }, null]),
                }),
                type: 'mockResourceType',
              }),
            ]),
          }),
        }),
        type: 'mockResourceType',
      }),
    );
  });

  it('should set the response body to resources when no view is specified', async () => {
    const mockApp = {
      id: 1,
      definition: {
        resources: {
          mockResourceType: { id: 'id', schema: {} },
        } as Record<string, ResourceDefinition>,
      } as AppDefinition,
    } as App;
    const mockResources = [{ id: 1 }, { id: 2 }] as Resource[];
    const mockParsedQuery = {
      order: [
        ['mockField1', 'mockOrderAsc'],
        ['mockField2', 'mockOrderDesc'],
      ],
      where: { mockField: 'mockValue' },
    } as ParsedQuery;

    mockGetApp.mockResolvedValue(mockApp);
    mockGetAppResources.mockResolvedValue(mockResources);
    mockParseQuery.mockReturnValue(mockParsedQuery);

    const middleware = createQueryResources({
      getApp: mockGetApp as (params: GetAppParams) => Promise<App>,
      getAppResources: mockGetAppResources as (
        params: GetAppResourcesParams,
      ) => Promise<Resource[]>,
      verifyResourceActionPermission: mockVerifyResourceActionPermission as (
        params: VerifyResourceActionPermissionParams,
      ) => Promise<Record<string, any>>,
      parseQuery: mockParseQuery as (params: ParseQueryParams) => ParsedQuery,
    } as Options);

    await middleware(mockCtx, vi.fn());

    expect(mockCtx.body).toStrictEqual(mockResources);
  });

  it('should set the response body to remapped resources when view is specified', async () => {
    const mockApp = {
      id: 1,
      definition: {
        resources: {
          mockResourceType: { id: 'id', schema: {}, views: { view: {} as ResourceView } },
        } as Record<string, ResourceDefinition>,
      } as AppDefinition,
    } as App;
    const mockResources = [{ id: 1 }, { id: 2 }] as Resource[];
    const mockParsedQuery = {
      order: [
        ['mockField1', 'mockOrderAsc'],
        ['mockField2', 'mockOrderDesc'],
      ],
      where: { mockField: 'mockValue' },
    } as ParsedQuery;
    const mockAppUrl = new URL('https://localhost');
    const mockAppMessages = [{ language: 'eng', messages: {} }] as AppMessages[];

    mockGetApp.mockResolvedValue(mockApp);
    mockGetAppResources.mockResolvedValue(mockResources);
    mockParseQuery.mockReturnValue(mockParsedQuery);
    mockGetAppUrl.mockResolvedValue(mockAppUrl);
    mockGetAppMessages.mockResolvedValue(mockAppMessages);

    mockCtx.queryParams.view = 'view';

    const options = {
      getApp: mockGetApp as (params: GetAppParams) => Promise<App>,
      getAppResources: mockGetAppResources as (
        params: GetAppResourcesParams,
      ) => Promise<Resource[]>,
      verifyResourceActionPermission: mockVerifyResourceActionPermission as (
        params: VerifyResourceActionPermissionParams,
      ) => Promise<Record<string, any>>,
      parseQuery: mockParseQuery as (params: ParseQueryParams) => ParsedQuery,
      getAppUrl: mockGetAppUrl as (params: GetAppSubEntityParams) => Promise<URL>,
      getAppMessages: mockGetAppMessages as (
        params: GetAppMessagesParams,
      ) => Promise<AppMessages[]>,
    } as Options;

    const resourceDefinition = getResourceDefinition(mockApp, 'mockResourceType', mockCtx, 'view');

    const remapperContext = await getRemapperContext(
      mockApp,
      mockApp.definition.defaultLanguage || defaultLocale,
      null,
      options,
      mockCtx,
    );

    const remappedResources = mockResources.map((resource) =>
      remap(resourceDefinition.views.view.remap, resource, remapperContext),
    );

    const middleware = createQueryResources(options);

    await middleware(mockCtx, vi.fn());

    expect(mockCtx.body).toStrictEqual(remappedResources);
  });
});

describe('createCountResources', () => {
  beforeEach(() => {
    mockGetApp = vi.fn();
    mockGetAppResources = vi.fn();
    mockVerifyResourceActionPermission = vi.fn();
    mockParseQuery = vi.fn();
    mockCtx = {
      pathParams: { appId: 1, resourceType: 'mockResourceType' } as PathParams,
      queryParams: {} as QueryParams,
      user: { id: 'mockUserId', name: 'John Doe', primaryEmail: 'john@example.com' } as UtilsUser,
    } as ParameterizedContext<DefaultState, DefaultContext>;
  });

  it('should fetch app and resources with correct parameters', async () => {
    const mockApp = {
      id: 1,
      definition: {
        resources: {
          mockResourceType: { id: 'id', schema: {} },
        } as Record<string, ResourceDefinition>,
      } as AppDefinition,
    } as App;
    const mockResources = [{ id: 1 }, { id: 2 }] as Resource[];
    const mockParsedQuery = {
      order: [
        ['mockField1', 'mockOrderAsc'],
        ['mockField2', 'mockOrderDesc'],
      ],
      where: { mockField: 'mockValue' },
    } as ParsedQuery;

    mockGetApp.mockResolvedValue(mockApp);
    mockGetAppResources.mockResolvedValue(mockResources);
    mockParseQuery.mockReturnValue(mockParsedQuery);

    const middleware = createCountResources({
      getApp: mockGetApp as (params: GetAppParams) => Promise<App>,
      getAppResources: mockGetAppResources as (
        params: GetAppResourcesParams,
      ) => Promise<Resource[]>,
      verifyResourceActionPermission: mockVerifyResourceActionPermission as (
        params: VerifyResourceActionPermissionParams,
      ) => Promise<Record<string, any>>,
      parseQuery: mockParseQuery as (params: ParseQueryParams) => ParsedQuery,
    } as Options);

    await middleware(mockCtx, vi.fn());

    expect(mockGetApp).toHaveBeenCalledWith(
      expect.objectContaining({
        context: expect.objectContaining({
          pathParams: expect.objectContaining({ appId: 1 }),
        }),
        query: expect.objectContaining({ where: { id: 1 } }),
      }),
    );

    expect(mockGetAppResources).toHaveBeenCalledWith(
      expect.objectContaining({
        app: {
          definition: {
            resources: {
              mockResourceType: {
                id: 'id',
                schema: {},
              },
            },
          },
          id: 1,
        },
        context: expect.objectContaining({
          pathParams: expect.objectContaining({
            appId: 1,
            resourceType: 'mockResourceType',
          }),
          user: expect.objectContaining({
            id: 'mockUserId',
            name: 'John Doe',
            primaryEmail: 'john@example.com',
          }),
        }),
        findOptions: expect.objectContaining({
          where: expect.objectContaining({
            and: expect.arrayContaining([
              expect.objectContaining({ mockField: 'mockValue' }),
              expect.objectContaining({
                AppId: 1,
                expires: expect.objectContaining({
                  or: expect.arrayContaining([{ gt: expect.any(Date) }, null]),
                }),
                type: 'mockResourceType',
              }),
            ]),
          }),
        }),
        type: 'mockResourceType',
      }),
    );
  });

  it('should set the response body to resources count', async () => {
    const mockApp = {
      id: 1,
      definition: {
        resources: {
          mockResourceType: { id: 'id', schema: {} },
        } as Record<string, ResourceDefinition>,
      } as AppDefinition,
    } as App;
    const mockResources = [{ id: 1 }, { id: 2 }] as Resource[];
    const mockParsedQuery = {
      order: [
        ['mockField1', 'mockOrderAsc'],
        ['mockField2', 'mockOrderDesc'],
      ],
      where: { mockField: 'mockValue' },
    } as ParsedQuery;

    mockGetApp.mockResolvedValue(mockApp);
    mockGetAppResources.mockResolvedValue(mockResources);
    mockParseQuery.mockReturnValue(mockParsedQuery);

    const middleware = createCountResources({
      getApp: mockGetApp as (params: GetAppParams) => Promise<App>,
      getAppResources: mockGetAppResources as (
        params: GetAppResourcesParams,
      ) => Promise<Resource[]>,
      verifyResourceActionPermission: mockVerifyResourceActionPermission as (
        params: VerifyResourceActionPermissionParams,
      ) => Promise<Record<string, any>>,
      parseQuery: mockParseQuery as (params: ParseQueryParams) => ParsedQuery,
    } as Options);

    await middleware(mockCtx, vi.fn());

    expect(mockCtx.body).toStrictEqual(mockResources.length);
  });
});

describe('createGetResourceById', () => {
  beforeEach(() => {
    mockGetApp = vi.fn();
    mockGetAppResource = vi.fn();
    mockVerifyResourceActionPermission = vi.fn();
    mockGetAppUrl = vi.fn();
    mockGetAppMessages = vi.fn();

    mockCtx = {
      pathParams: { appId: 1, resourceId: 1, resourceType: 'mockResourceType' } as PathParams,
      user: { id: 'mockUserId', name: 'John Doe', primaryEmail: 'john@example.com' } as UtilsUser,
    } as ParameterizedContext<DefaultState, DefaultContext>;
  });

  it('should fetch app and resource with correct parameters', async () => {
    const mockApp = {
      id: 1,
      definition: {
        resources: {
          mockResourceType: { id: 'id', schema: {} },
        } as Record<string, ResourceDefinition>,
      } as AppDefinition,
    } as App;
    const mockResource = { id: 1 } as Resource;

    mockGetApp.mockResolvedValue(mockApp);
    mockGetAppResource.mockResolvedValue(mockResource);

    const middleware = createGetResourceById({
      getApp: mockGetApp as (params: GetAppParams) => Promise<App>,
      getAppResource: mockGetAppResource as (params: GetAppResourceParams) => Promise<Resource>,
      verifyResourceActionPermission: mockVerifyResourceActionPermission as (
        params: VerifyResourceActionPermissionParams,
      ) => Promise<Record<string, any>>,
    } as Options);

    await middleware(mockCtx, vi.fn());

    expect(mockGetApp).toHaveBeenCalledWith(
      expect.objectContaining({
        context: expect.objectContaining({
          pathParams: expect.objectContaining({ appId: 1 }),
        }),
        query: expect.objectContaining({ where: { id: 1 } }),
      }),
    );

    expect(mockGetAppResource).toHaveBeenCalledWith(
      expect.objectContaining({
        app: {
          definition: {
            resources: {
              mockResourceType: {
                id: 'id',
                schema: {},
              },
            },
          },
          id: 1,
        },
        id: 1,
        type: 'mockResourceType',
        context: expect.objectContaining({
          pathParams: expect.objectContaining({
            appId: 1,
            resourceType: 'mockResourceType',
          }),
          user: expect.objectContaining({
            id: 'mockUserId',
            name: 'John Doe',
            primaryEmail: 'john@example.com',
          }),
        }),
        findOptions: expect.objectContaining({
          where: expect.objectContaining({
            id: 1,
            type: 'mockResourceType',
            AppId: 1,
            expires: expect.objectContaining({
              or: expect.arrayContaining([{ gt: expect.any(Date) }, null]),
            }),
          }),
        }),
      }),
    );
  });

  it('should set the response body to resource when no view is specified', async () => {
    const mockApp = {
      id: 1,
      definition: {
        resources: {
          mockResourceType: { id: 'id', schema: {} },
        } as Record<string, ResourceDefinition>,
      } as AppDefinition,
    } as App;
    const mockResource = { id: 1 } as Resource;

    mockGetApp.mockResolvedValue(mockApp);
    mockGetAppResource.mockResolvedValue(mockResource);

    const middleware = createGetResourceById({
      getApp: mockGetApp as (params: GetAppParams) => Promise<App>,
      getAppResource: mockGetAppResource as (params: GetAppResourceParams) => Promise<Resource>,
      verifyResourceActionPermission: mockVerifyResourceActionPermission as (
        params: VerifyResourceActionPermissionParams,
      ) => Promise<Record<string, any>>,
    } as Options);

    await middleware(mockCtx, vi.fn());

    expect(mockCtx.body).toStrictEqual(mockResource);
  });

  it('should set the response body to remapped resource when view is specified', async () => {
    const mockApp = {
      id: 1,
      definition: {
        resources: {
          mockResourceType: { id: 'id', schema: {}, views: { view: {} as ResourceView } },
        } as Record<string, ResourceDefinition>,
      } as AppDefinition,
    } as App;
    const mockResource = { id: 1 } as Resource;
    const mockAppUrl = new URL('https://localhost');
    const mockAppMessages = [{ language: 'eng', messages: {} }] as AppMessages[];

    mockGetApp.mockResolvedValue(mockApp);
    mockGetAppResource.mockResolvedValue(mockResource);
    mockGetAppUrl.mockResolvedValue(mockAppUrl);
    mockGetAppMessages.mockResolvedValue(mockAppMessages);

    mockCtx.queryParams = { view: 'view' } as QueryParams;

    const options = {
      getApp: mockGetApp as (params: GetAppParams) => Promise<App>,
      getAppResource: mockGetAppResource as (params: GetAppResourceParams) => Promise<Resource>,
      verifyResourceActionPermission: mockVerifyResourceActionPermission as (
        params: VerifyResourceActionPermissionParams,
      ) => Promise<Record<string, any>>,
      getAppUrl: mockGetAppUrl as (params: GetAppSubEntityParams) => Promise<URL>,
      getAppMessages: mockGetAppMessages as (
        params: GetAppMessagesParams,
      ) => Promise<AppMessages[]>,
    } as Options;

    const resourceDefinition = getResourceDefinition(mockApp, 'mockResourceType', mockCtx, 'view');

    const remapperContext = await getRemapperContext(
      mockApp,
      mockApp.definition.defaultLanguage || defaultLocale,
      null,
      options,
      mockCtx,
    );

    const remappedResource = remap(
      resourceDefinition.views.view.remap,
      mockResource,
      remapperContext,
    );

    const middleware = createGetResourceById(options);

    await middleware(mockCtx, vi.fn());

    expect(mockCtx.body).toStrictEqual(remappedResource);
  });
});

describe('createCreateResource', () => {
  beforeEach(() => {
    mockGetApp = vi.fn();
    mockVerifyResourceActionPermission = vi.fn();
    mockCreateAppResourcesWithAssets = vi.fn();

    mockCtxIs = vi.fn();
    mockCtx = {
      pathParams: { appId: 1, resourceType: 'mockResourceType' } as PathParams,
      user: { id: 'mockUserId', name: 'John Doe', primaryEmail: 'john@example.com' } as UtilsUser,
      is: mockCtxIs as () => string,
      request: {},
    } as ParameterizedContext<DefaultState, DefaultContext>;
  });

  it('should fetch app and create multiple resources', async () => {
    const mockApp = {
      id: 1,
      definition: {
        resources: {
          mockResourceType: { id: 'id', schema: {} },
        } as Record<string, ResourceDefinition>,
      } as AppDefinition,
    } as App;
    const mockResources = [{ id: 1 }, { id: 2 }] as Resource[];

    mockCtx.request.body = { resource: mockResources };

    mockGetApp.mockResolvedValue(mockApp);
    mockCtxIs.mockReturnValue('multipart/form-data');
    mockCreateAppResourcesWithAssets.mockResolvedValue(mockResources);

    const middleware = createCreateResource({
      getApp: mockGetApp as (params: GetAppParams) => Promise<App>,
      createAppResourcesWithAssets: mockCreateAppResourcesWithAssets as (
        params: CreateAppResourcesWithAssetsParams,
      ) => Promise<Resource[]>,
      verifyResourceActionPermission: mockVerifyResourceActionPermission as (
        params: VerifyResourceActionPermissionParams,
      ) => Promise<Record<string, any>>,
    } as Options);

    await middleware(mockCtx, vi.fn());

    expect(mockGetApp).toHaveBeenCalledWith(
      expect.objectContaining({
        context: expect.objectContaining({
          pathParams: expect.objectContaining({ appId: 1 }),
        }),
        query: expect.objectContaining({ where: { id: 1 } }),
      }),
    );

    expect(mockCreateAppResourcesWithAssets).toHaveBeenCalledWith(
      expect.objectContaining({
        app: expect.objectContaining({
          definition: expect.objectContaining({
            resources: expect.objectContaining({
              mockResourceType: expect.objectContaining({
                id: 'id',
                schema: {},
              }),
            }),
          }),
          id: 1,
        }),
        context: expect.objectContaining({
          request: expect.objectContaining({
            body: {
              resource: mockResources,
            },
          }),
          pathParams: expect.objectContaining({
            appId: 1,
            resourceType: 'mockResourceType',
          }),
          user: expect.objectContaining({
            id: 'mockUserId',
            name: 'John Doe',
            primaryEmail: 'john@example.com',
          }),
        }),
      }),
    );

    expect(mockCtx.body).toStrictEqual(mockResources);
  });

  it('should fetch app and create a single resource', async () => {
    const mockApp = {
      id: 1,
      definition: {
        resources: {
          mockResourceType: { id: 'id', schema: {} },
        } as Record<string, ResourceDefinition>,
      } as AppDefinition,
    } as App;
    const mockResources = [{ id: 1 }] as Resource[];

    mockCtx.request.body = { resource: mockResources[0] };

    mockGetApp.mockResolvedValue(mockApp);
    mockCtxIs.mockReturnValue('multipart/form-data');
    mockCreateAppResourcesWithAssets.mockResolvedValue(mockResources);

    const middleware = createCreateResource({
      getApp: mockGetApp as (params: GetAppParams) => Promise<App>,
      createAppResourcesWithAssets: mockCreateAppResourcesWithAssets as (
        params: CreateAppResourcesWithAssetsParams,
      ) => Promise<Resource[]>,
      verifyResourceActionPermission: mockVerifyResourceActionPermission as (
        params: VerifyResourceActionPermissionParams,
      ) => Promise<Record<string, any>>,
    } as Options);

    await middleware(mockCtx, vi.fn());

    expect(mockGetApp).toHaveBeenCalledWith(
      expect.objectContaining({
        context: expect.objectContaining({
          pathParams: expect.objectContaining({ appId: 1 }),
        }),
        query: expect.objectContaining({ where: { id: 1 } }),
      }),
    );

    expect(mockCreateAppResourcesWithAssets).toHaveBeenCalledWith(
      expect.objectContaining({
        app: expect.objectContaining({
          definition: expect.objectContaining({
            resources: expect.objectContaining({
              mockResourceType: expect.objectContaining({
                id: 'id',
                schema: {},
              }),
            }),
          }),
          id: 1,
        }),
        context: expect.objectContaining({
          request: expect.objectContaining({
            body: {
              resource: mockResources[0],
            },
          }),
          pathParams: expect.objectContaining({
            appId: 1,
            resourceType: 'mockResourceType',
          }),
          user: expect.objectContaining({
            id: 'mockUserId',
            name: 'John Doe',
            primaryEmail: 'john@example.com',
          }),
        }),
      }),
    );

    expect(mockCtx.body).toStrictEqual(mockResources[0]);
  });
});
