import { App, BlockDefinition, Theme as ThemeType } from '@appsemble/types';
import { IdentifiableBlock } from '@appsemble/utils';
import { DefaultContext, DefaultState, ParameterizedContext } from 'koa';

export interface GetAppParams {
  context: ParameterizedContext<DefaultState, DefaultContext, any>;
  query?: Record<string, any>;
}

export interface GetAppSubEntityParams {
  app: App;
}

export interface GetAppBlockStylesParams extends GetAppSubEntityParams {
  name: string;
}

export interface GetDbUpdatedParams extends GetAppSubEntityParams {
  maskable: string[] | string | false;
}

export interface GetAppLanguagesParams extends GetAppSubEntityParams {
  defaultLanguage: string;
}

export interface GetBlockAssetParams {
  filename: string;
  name: string;
  version: string;
}

export interface GetBlocksAssetsPathsParams {
  identifiableBlocks: IdentifiableBlock[];
}

export type ExtendedTheme = Omit<Partial<ThemeType>, 'font'> & {
  bulmaVersion: string;
  fontFamily: string;
  fontSource: string;
};

export interface GetThemeParams {
  theme: ExtendedTheme;
}

export interface CreateThemeParams extends ExtendedTheme {
  css: string;
}

export interface CreateSettingsParams {
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

export interface AppDetails {
  appPath: string;
  organizationId: string;
}

export interface RawApp {
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
  id: number;
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

export interface AppRouterOptions {
  getApp: (params: GetAppParams) => Promise<App>;
  getAppDetails: (params: GetAppParams) => Promise<AppDetails>;
  getAppRaw: (params: GetAppParams) => Promise<RawApp>;
  getAppScreenshots: (params: GetAppSubEntityParams) => Promise<AppScreenshot[]>;
  getAppBlockStyles: (params: GetAppBlockStylesParams) => Promise<AppBlockStyle[]>;
  getAppIcon: (params: GetAppSubEntityParams) => Promise<Buffer>;
  getAppUrl: (params: GetAppSubEntityParams) => Promise<URL>;
  getAppLanguages: (params: GetAppLanguagesParams) => Promise<string[]>;
  getDbUpdated: (params: GetDbUpdatedParams) => Promise<Date | number>;
  getBlockAsset: (params: GetBlockAssetParams) => Promise<BlockAsset>;
  getBlocksAssetsPaths: (params: GetBlocksAssetsPathsParams) => Promise<string[]>;
  getTheme: (params: GetThemeParams) => Promise<Theme>;
  createTheme: (params: CreateThemeParams) => Promise<Theme>;
  getHost: () => string;
  getCsp: (params: GetCspParams) => ContentSecurityPolicy;
  createSettings: (params: CreateSettingsParams) => Promise<[digest: string, script: string]>;
}
