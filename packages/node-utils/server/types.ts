import {
  App,
  AppMessages,
  Asset,
  BlockConfig,
  BlockDefinition,
  BlockManifest,
  Resource,
  Theme as ThemeType,
} from '@appsemble/types';
import { IdentifiableBlock, Permission } from '@appsemble/utils';
import { DefaultContext, DefaultState, ParameterizedContext } from 'koa';

declare module 'koa' {
  interface Request {
    body: any;
  }

  interface DefaultContext {
    appHost: string;
    appsembleApp: App;
    appBlocks: BlockManifest[];
    appMessages: AppMessages[];
    appAssets: AppAsset[];
    blockConfigs: ContextBlockConfig[];
    params?: Record<string, string>;
  }
}

declare module 'koas-security' {
  interface Clients {
    app: { scope: string; app: App };
    basic: {};
    cli: { scope: string };
    studio: {};
  }

  interface Users {
    app: any;
    basic: any;
    cli: any;
    studio: any;
  }
}

declare module 'koas-parameters' {
  interface PathParams {
    appId: number;
    appOAuth2SecretId: number;
    appSamlSecretId: number;
    assetId: string;
    blockId: string;
    blockVersion: string;
    clientId: string;
    language: string;
    memberId: string;
    organizationId: string;
    path: string;
    resourceId: number;
    resourceType: string;
    screenshotId: number;
    snapshotId: number;
    teamId: string;
    token: string;
  }

  interface QueryParams {
    domains: string[];
    $filter?: string;
    $orderby?: string;
    $select: string;
    $top: number;
    $skip: number;
    code: string;
    view: string;
  }
}

export interface FindOptions {
  where?: Record<string, any>;
  limit?: number;
  offset?: number;
  attributes?: string[];
}

export interface ContextBlockConfig extends BlockConfig {
  OrganizationId: string;
}

export interface GetAppParams {
  context: ParameterizedContext<DefaultState, DefaultContext, any>;
  query?: Record<string, any>;
}

export interface GetAppSubEntityParams {
  context: ParameterizedContext<DefaultState, DefaultContext, any>;
  app: App;
}

export interface GetAppBlockStylesParams extends GetAppSubEntityParams {
  name: string;
}

export interface GetDbUpdatedParams extends GetAppSubEntityParams {
  maskable: string[] | string | false;
}

export interface GetBlockAssetParams {
  context: ParameterizedContext<DefaultState, DefaultContext, any>;
  filename: string;
  name: string;
  version: string;
}

export interface GetBlocksAssetsPathsParams {
  context: ParameterizedContext<DefaultState, DefaultContext, any>;
  identifiableBlocks: IdentifiableBlock[];
}

export type ExtendedTheme = Omit<Partial<ThemeType>, 'font'> & {
  bulmaVersion: string;
  fontFamily: string;
  fontSource: string;
};

export interface GetHostParams {
  context: ParameterizedContext<DefaultState, DefaultContext, any>;
}

export interface GetThemeParams {
  theme: ExtendedTheme;
}

export interface CreateThemeParams extends ExtendedTheme {
  css: string;
}

export interface CreateSettingsParams {
  context: ParameterizedContext<DefaultState, DefaultContext, any>;
  app: App;
  host: string;
  identifiableBlocks: IdentifiableBlock[];
  hostname: string;
  languages: string[];
}

export interface GetCspParams {
  app: App;
  host: string;
  hostname: string;
  settingsHash: string;
  nonce: string;
}

export interface VerifyPermissionParams {
  context: ParameterizedContext<DefaultState, DefaultContext, any>;
  app: App;
  resourceType: string;
  action: 'count' | 'create' | 'delete' | 'get' | 'patch' | 'query' | 'update';
}

export interface CheckRoleParams {
  context: ParameterizedContext<DefaultState, DefaultContext, any>;
  app: App;
  permissions: Permission | Permission[];
  findOptions: FindOptions;
}

export interface ParseQueryParams {
  $filter: string;
  $orderby: string;
}

export interface GetAppResourceParams extends GetAppSubEntityParams {
  id: number | string;
  type: string;
}

export interface GetAppResourcesParams extends GetAppSubEntityParams {
  findOptions: FindOptions;
  type: string;
}

export interface PreparedAsset extends Pick<Asset, 'filename' | 'id' | 'mime'> {
  data: Buffer;
  resource?: Record<string, unknown>;
}

export interface CreateResourcesWithAssetsParams {
  app: App;
  resources: Record<string, unknown>[];
  preparedAssets: PreparedAsset[];
  resourceType: string;
}

export interface UpdateAppResourceParams extends GetAppSubEntityParams {
  id: number | string;
  resource: Record<string, unknown>;
  type: string;
}

export interface DeleteAppResourceParams extends GetAppSubEntityParams {
  id: number | string;
  type: string;
}

export interface AppDetails {
  appPath: string;
  organizationId: string;
}

export interface AppStyles {
  coreStyle: string | undefined;
  sharedStyle: string | undefined;
}

export interface AppScreenshot {
  id: number;
  mime: string;
  screenshot: Buffer;
  height: number;
  width: number;
}

export interface AppBlockStyle {
  style: string;
}

export interface AppAsset extends Asset {
  content: Buffer;
}

export interface BlockAsset {
  mime: string;
  content: Buffer;
}

export interface Block extends BlockDefinition {
  OrganizationId: string;
}

export interface Theme {
  css: string;
}

export interface ParsedQuery {
  order: any;
  where: Pick<FindOptions, 'where'>;
}

export type ContentSecurityPolicy = Record<string, (string | false)[]>;

export interface Options {
  getApp: (params: GetAppParams) => Promise<App>;
  getAppDetails: (params: GetAppParams) => Promise<AppDetails>;
  getAppMessages: (params: GetAppSubEntityParams) => Promise<AppMessages[]>;
  getAppStyles: (params: GetAppParams | GetAppSubEntityParams) => Promise<AppStyles>;
  getAppScreenshots: (params: GetAppSubEntityParams) => Promise<AppScreenshot[]>;
  getAppBlockStyles: (params: GetAppBlockStylesParams) => Promise<AppBlockStyle[]>;
  getAppIcon: (params: GetAppSubEntityParams) => Promise<Buffer>;
  getAppUrl: (params: GetAppSubEntityParams) => Promise<URL>;
  getDbUpdated: (params: GetDbUpdatedParams) => Promise<Date | number>;
  getBlockAsset: (params: GetBlockAssetParams) => Promise<BlockAsset>;
  getBlocksAssetsPaths: (params: GetBlocksAssetsPathsParams) => Promise<string[]>;
  getTheme: (params: GetThemeParams) => Promise<Theme>;
  createTheme: (params: CreateThemeParams) => Promise<Theme>;
  getHost: (params: GetHostParams) => string;
  getCsp: (params: GetCspParams) => ContentSecurityPolicy;
  createSettings: (params: CreateSettingsParams) => Promise<[digest: string, script: string]>;
  verifyPermission: (params: VerifyPermissionParams) => Promise<Record<string, any>>;
  checkRole: (params: CheckRoleParams) => Promise<Record<string, any>>;
  parseQuery: (params: ParseQueryParams) => ParsedQuery;
  getAppResource: (params: GetAppResourceParams) => Promise<Resource>;
  getAppResources: (params: GetAppResourcesParams) => Promise<Resource[]>;
  createResourcesWithAssets: (params: CreateResourcesWithAssetsParams) => Promise<Resource[]>;
  updateAppResource: (params: UpdateAppResourceParams) => Promise<Resource | null>;
  deleteAppResource: (params: DeleteAppResourceParams) => Promise<void>;
  getAppAssets: (params: GetAppSubEntityParams) => Promise<AppAsset[]>;
}
