import { FindOptions } from '@appsemble/cli/server/db/types';
import { User } from '@appsemble/server/models';
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
import { IdentifiableBlock } from '@appsemble/utils';
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
    app: User;
    basic: User;
    cli: User;
    studio: User;
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

export interface GetAppResourceParams extends GetAppSubEntityParams {
  id: number | string;
  type: string;
}

export interface GetAppResourcesParams extends GetAppSubEntityParams {
  query: FindOptions;
  type: string;
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

export interface VerifyPermissionParams {
  context: ParameterizedContext<DefaultState, DefaultContext, any>;
  app: App;
  resourceType: string;
  action: 'count' | 'create' | 'delete' | 'get' | 'patch' | 'query' | 'update';
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

export type ContentSecurityPolicy = Record<string, (string | false)[]>;

export interface Options {
  getApp: (params: GetAppParams) => Promise<App>;
  getAppDetails: (params: GetAppParams) => Promise<AppDetails>;
  getAppMessages: (params: GetAppSubEntityParams) => Promise<AppMessages[]>;
  getAppStyles: (params: GetAppParams | GetAppSubEntityParams) => Promise<AppStyles>;
  getAppScreenshots: (params: GetAppSubEntityParams) => Promise<AppScreenshot[]>;
  getAppResource: (params: GetAppResourceParams) => Promise<Resource>;
  getAppResources: (params: GetAppResourcesParams) => Promise<Resource[]>;
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
  createResourcesWithAssets: (params: CreateResourcesWithAssetsParams) => Promise<Resource[]>;
  verifyPermission: (params: VerifyPermissionParams) => Promise<Record<string, any>>;
}
