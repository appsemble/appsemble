import { type Readable } from 'node:stream';

import {
  type BlockDefinition,
  type ControllerDefinition,
  type CustomAppPermission,
  type EmailActionDefinition,
  type IdentifiableBlock,
  type ResourceDefinition,
  type Theme as ThemeType,
} from '@appsemble/lang-sdk';
import {
  type App,
  type AppConfigEntry,
  type AppMemberInfo,
  type AppMessages,
  type Asset,
  type BlockManifest,
  type Group,
  type OrganizationPermission,
  type Resource,
} from '@appsemble/types';
import { type RawAxiosRequestConfig } from 'axios';
import {
  type DefaultContext as DefaultContextInterface,
  type DefaultState,
  type ParameterizedContext,
} from 'koa';

export interface AuthSubject {
  id: string;
}

declare module 'koa' {
  interface Request {
    body: any;
  }

  interface DefaultContext {
    appPath: string;
    appHost: string;
    appsembleApp: App;
    appBlocks: BlockManifest[];
    appMessages: AppMessages[];
    appVariables: AppConfigEntry[];
    appMembers: AppMemberInfo[];
    appMemberInfo: AppMemberInfo;
    appGroups: ExtendedGroup[];
    appAssets: AppAsset[];
    appReadmes: AppReadme[];
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
    webhook: {};
  }

  interface Users {
    app: AuthSubject;
    basic: AuthSubject;
    cli: AuthSubject;
    scim: AuthSubject;
    studio: AuthSubject;
    webhook: AuthSubject;
  }
}

declare module 'koas-parameters' {
  interface PathParams {
    appId: number;
    appCollectionId: number;
    appOAuth2SecretId: number;
    appSamlSecretId: number;
    assetId: string;
    blockId: string;
    blockVersion: string;
    controllerName: string;
    controllerVersion: string;
    clientId: string;
    language: string;
    organizationMemberId: string;
    groupMemberId: string;
    appMemberId: string;
    organizationId: string;
    organizationSubscriptionId: number;
    path: string;
    resourceId: number;
    resourceType: string;
    resourceTypeId: string;
    schemaId: string;
    screenshotId: number;
    readmeId: number;
    snapshotId: number;
    groupId: number;
    token: string;
    serviceSecretId: number;
    appSecretId: number;
    appVariableId: number;
    userId: string;
    memberEmail: string;
    trainingId: number;
    container: string;
    webhookName: string;
    webhookSecretId: string;
  }

  interface QueryParams {
    domains: string[];
    $filter?: string;
    filter: string;
    $orderby?: string;
    $select: string;
    organizationId: string;
    $top: number;
    $skip: number;
    code: string;
    count: number;
    period: string;
    subscriptionType: string;
    price: string;
    locale: string;
    couponCode: string;
    startIndex: number;
    view: string;
    resources: boolean;
    assets: boolean;
    organizationSubscriptionExpiresWithin: number;
    screenshots: boolean;
    readmes: boolean;
    roles?: string;
    includeMessages: boolean;
    demo: boolean;
    selectedGroupId: number;
    $own: boolean;
    delimiter?: string;
    email: string;
  }
}

export type Operator = 'and' | 'not' | 'or';
export type Function = 'gt';
type Reserved = Function | Operator;

export type NonReserved<T extends string> = T extends Reserved ? never : T;

export type WhereOptions = Record<string, any>;

export type OrderItem = [string, string];

export interface FindOptions {
  where?: WhereOptions;
  limit?: number;
  offset?: number;
  attributes?: string[];
  order?: OrderItem[];
  include?: any[];
}

export interface ContextBlockConfig extends BlockManifest {
  OrganizationId: string;
}

export interface GetAppParams {
  context: ParameterizedContext<DefaultState, DefaultContextInterface, any>;
  query?: Record<string, any>;
}

export interface GetAppSubEntityParams {
  context: ParameterizedContext<DefaultState, DefaultContextInterface, any>;
  app: App;
}

export interface GetAppVariablesParams extends GetAppSubEntityParams {
  query?: Record<string, any>;
}

export interface GetAppMessagesParams extends GetAppSubEntityParams {
  language?: string;
  merge?: string[] | string;
}

export interface ExtendedGroup extends Group {
  size: number;
}

export interface GetAppBlockStylesParams extends GetAppSubEntityParams {
  name: string;
}

export interface GetDbUpdatedParams extends GetAppSubEntityParams {
  maskable: string[] | string | false;
}

export type BlockMessages = Pick<BlockManifest, 'messages' | 'name' | 'version'>;

export type BlockQueryItem = Pick<ContextBlockConfig, 'name' | 'OrganizationId' | 'version'>;

export interface GetBlockMessagesParams {
  context: ParameterizedContext<DefaultState, DefaultContextInterface, any>;
  blockQuery: BlockQueryItem[];
  baseLang: string;
  lang: string;
}

export interface GetBlockAssetParams {
  context: ParameterizedContext<DefaultState, DefaultContextInterface, any>;
  name: string;
  filename: string;
  version: string;
}

export interface GetControllerVersionAssetParams {
  controllerName: string;
  controllerVersion: string;
  organizationId: string;
  filename: string[] | string;
}

export interface GetBlocksAssetsPathsParams {
  context: ParameterizedContext<DefaultState, DefaultContextInterface, any>;
  identifiableBlocks: IdentifiableBlock[];
}

export type ExtendedTheme = Omit<Partial<ThemeType>, 'font'> & {
  bulmaVersion: string;
  fontFamily: string;
  fontSource: string;
};

export interface GetHostParams {
  context: ParameterizedContext<DefaultState, DefaultContextInterface, any>;
}

export interface GetThemeParams {
  theme: ExtendedTheme;
}

export interface CreateThemeParams extends ExtendedTheme {
  css: string;
}

export interface CreateSettingsParams {
  context: ParameterizedContext<DefaultState, DefaultContextInterface, any>;
  app: App;
  host: string;
  identifiableBlocks: IdentifiableBlock[];
  controllerDefinition?: ControllerDefinition;
  hostname: string;
  languages: string[];
  nonce: string;
}

export interface GetCspParams {
  app: App;
  host: string;
  hostname: string;
  settingsHash: string;
  nonce: string;
}

export interface GetCurrentAppMemberParams {
  context: ParameterizedContext<DefaultState, DefaultContextInterface, any>;
  app: App;
}

export interface GetCurrentAppMemberGroupsParams {
  context: ParameterizedContext<DefaultState, DefaultContextInterface, any>;
  app: App;
}

export type ResourceAction = 'create' | 'delete' | 'update';
export type Action = ResourceAction | 'count' | 'get' | 'patch' | 'query';

export interface ApplyAppServiceSecretsParams {
  context: ParameterizedContext<DefaultState, DefaultContextInterface, any>;
  app: App;
  axiosConfig: RawAxiosRequestConfig<any>;
}

export interface CheckAppMemberAppPermissionsParams {
  context: ParameterizedContext<DefaultState, DefaultContextInterface, any>;
  permissions: CustomAppPermission[];
  app: App;
}

export interface CheckUserOrganizationPermissionsParams {
  context: ParameterizedContext<DefaultState, DefaultContextInterface, any>;
  permissions: OrganizationPermission[];
  app: App;
}

export interface CheckAuthSubjectAppPermissionsParams {
  context: ParameterizedContext<DefaultState, DefaultContextInterface, any>;
  app: App;
  groupId?: number;
  permissions: CustomAppPermission[];
}

export interface CheckAppPermissionsParams {
  context: ParameterizedContext<DefaultState, DefaultContextInterface, any>;
  app: App;
  groupId?: number;
  permissions: CustomAppPermission[];
}

export interface ReloadUserParams {
  context: ParameterizedContext<DefaultState, DefaultContextInterface, any>;
}

export interface ParseQueryParams {
  tableName: string;
  $filter: string;
  $orderby: string;
  resourceDefinition: ResourceDefinition;
}

export interface GetAppResourceParams extends GetAppSubEntityParams {
  findOptions: FindOptions;
  type: string;
  id: number | string;
}

export interface GetAppAssetParams extends GetAppSubEntityParams {
  id: string;
}

export interface GetAppResourcesParams extends GetAppSubEntityParams {
  findOptions: FindOptions;
  type: string;
}

export interface PreparedAsset extends Pick<Asset, 'filename' | 'id' | 'mime'> {
  path: string;
  resource?: Record<string, unknown>;
}

export interface CreateAppResourcesWithAssetsParams extends GetAppSubEntityParams {
  resources: Record<string, unknown>[];
  preparedAssets: PreparedAsset[];
  resourceType: string;
  options: Options;
  groupId?: number;
}

export interface UpdateAppResourceParams extends GetAppSubEntityParams {
  id: number | string;
  resource: Record<string, unknown>;
  preparedAssets: PreparedAsset[];
  resourceDefinition: ResourceDefinition;
  deletedAssetIds: string[];
  type: string;
  options: Options;
}

export interface DeleteAppResourceParams extends GetAppSubEntityParams {
  id: number | string;
  type: string;
  whereOptions?: WhereOptions;
  options: Options;
}

export interface CreateAppAssetParams extends GetAppSubEntityParams {
  payload: {
    filename: string;
    mime: string;
    name: string;
    path: string;
  };
  seed?: boolean;
}

export interface DeleteAppAssetParams extends GetAppSubEntityParams {
  id: string;
  transaction?: any;
}

export interface EmailParams {
  action: EmailActionDefinition;
  data: any;
  mailer: any;
  options: Options;
  context: ParameterizedContext<DefaultState, DefaultContextInterface, any>;
}

export interface SendNotificationsParams {
  app: App;
  to: string;
  title: string;
  body: string;
  link: string;
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

export interface AppReadme {
  id: number;
  file: Buffer;
}

export interface AppBlockStyle {
  style: string;
}

export interface AppAsset extends Asset {
  stream: Readable;
}

export interface ProjectAsset {
  filename: string;
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
  order: OrderItem[];
  where: WhereOptions;
}

export type ContentSecurityPolicy = Record<string, (string | false)[]>;

export interface Options {
  getCurrentAppMember: (params: GetCurrentAppMemberParams) => Promise<AppMemberInfo | null>;
  getCurrentAppMemberGroups: (params: GetCurrentAppMemberGroupsParams) => Promise<Group[] | null>;
  getApp: (params: GetAppParams) => Promise<App>;
  getAppDetails: (params: GetAppParams) => Promise<AppDetails>;
  getAppMessages: (params: GetAppMessagesParams) => Promise<AppMessages[]>;
  getAppGroups: (params: GetAppSubEntityParams) => Promise<ExtendedGroup[]>;
  getAppStyles: (params: GetAppParams | GetAppSubEntityParams) => Promise<AppStyles>;
  getAppScreenshots: (params: GetAppSubEntityParams) => Promise<AppScreenshot[]>;
  getAppReadmes: (params: GetAppSubEntityParams) => Promise<AppReadme[]>;
  getAppBlockStyles: (params: GetAppBlockStylesParams) => Promise<AppBlockStyle[]>;
  getAppIcon: (params: GetAppSubEntityParams) => Promise<Buffer>;
  getAppUrl: (params: GetAppSubEntityParams) => Promise<URL>;
  getDbUpdated: (params: GetDbUpdatedParams) => Promise<Date | number>;
  getBlockMessages: (params: GetBlockMessagesParams) => Promise<BlockMessages[]>;
  getBlockAsset: (params: GetBlockAssetParams) => Promise<ProjectAsset>;
  getBlocksAssetsPaths: (params: GetBlocksAssetsPathsParams) => Promise<string[]>;
  getTheme: (params: GetThemeParams) => Promise<Theme>;
  createTheme: (params: CreateThemeParams) => Promise<Theme>;
  getHost: (params: GetHostParams) => string;
  getCsp: (params: GetCspParams) => ContentSecurityPolicy;
  createSettings: (params: CreateSettingsParams) => Promise<[digest: string, script: string]>;
  applyAppServiceSecrets: (
    params: ApplyAppServiceSecretsParams,
  ) => Promise<RawAxiosRequestConfig<any>>;
  checkAppMemberAppPermissions: (params: CheckAppMemberAppPermissionsParams) => Promise<void>;
  checkUserOrganizationPermissions: (
    params: CheckUserOrganizationPermissionsParams,
  ) => Promise<void>;
  checkAuthSubjectAppPermissions: (params: CheckAuthSubjectAppPermissionsParams) => Promise<void>;
  checkAppPermissions: (params: CheckAppPermissionsParams) => Promise<void>;
  reloadUser: (params: ReloadUserParams) => Promise<Record<string, any>>;
  parseQuery: (params: ParseQueryParams) => ParsedQuery;
  getAppResource: (params: GetAppResourceParams) => Promise<Resource | null>;
  getAppResources: (params: GetAppResourcesParams) => Promise<Resource[]>;
  createAppResourcesWithAssets: (params: CreateAppResourcesWithAssetsParams) => Promise<Resource[]>;
  updateAppResource: (params: UpdateAppResourceParams) => Promise<Resource | null>;
  deleteAppResource: (params: DeleteAppResourceParams) => Promise<void>;
  getAppAssets: (params: GetAppSubEntityParams) => Promise<Asset[]>;
  getAppAsset: (params: GetAppAssetParams) => Promise<AppAsset>;
  createAppAsset: (params: CreateAppAssetParams) => Promise<AppAsset>;
  deleteAppAsset: (params: DeleteAppAssetParams) => Promise<number>;
  email: (params: EmailParams) => Promise<void>;
  sendNotifications: (params: SendNotificationsParams) => Promise<void>;
  getAppVariables: (params: GetAppVariablesParams) => Promise<AppConfigEntry[]>;
}

export class TempFile {
  readonly filename: string;

  readonly mime: string;

  readonly path: string;

  constructor({ filename, mime, path }: { filename: string; mime: string; path: string }) {
    this.filename = filename;
    this.mime = mime;
    this.path = path;
  }
}
