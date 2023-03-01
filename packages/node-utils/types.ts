import { App, Asset, BlockDefinition } from '@appsemble/types';
import { IdentifiableBlock } from '@appsemble/utils';
import { DefaultContext, DefaultState, ParameterizedContext } from 'koa';

interface GetAppParams {
  context: ParameterizedContext<DefaultState, DefaultContext, any>;
  query?: Record<string, any>;
}

interface GetAppSubEntityParams {
  app: App;
}

interface GetDbUpdatedParams {
  maskable: string[] | string | false;
}

interface GetBlockAssetParams {
  filename: string;
  name: string;
  version: string;
}

interface GetBlocksAssetsPathsParams {
  identifiableBlocks: IdentifiableBlock[];
}

export interface AppScreenshot {
  id: string;
  mime: string;
  screenshot: Buffer;
}

export interface AppScreenshotInfo {
  /**
   * The sizes of the asset file.
   */
  sizes: `${number}x${number}`;
  /**
   * The location of the asset file.
   */
  src: string;
  /**
   * The mimetype of the asset file.
   */
  type: string;
}

export interface BlockAsset extends Asset {
  /**
   * The content of the asset file.
   */
  content: Buffer;
}

export interface Block extends BlockDefinition {
  OrganizationId: string;
}

export interface AppRouterOptions {
  getApp: (params: GetAppParams) => Promise<App>;
  getAppScreenshots: (params: GetAppSubEntityParams) => Promise<AppScreenshot[]>;
  getAppScreenshotsInfo: (params: GetAppSubEntityParams) => Promise<AppScreenshotInfo[]>;
  getAppIcon: (params: GetAppSubEntityParams) => Promise<Buffer>;
  getDbUpdated: (params: GetDbUpdatedParams) => Promise<Date | number>;
  getBlockAsset: (params: GetBlockAssetParams) => Promise<BlockAsset>;
  getBlocksAssetsPaths: (params: GetBlocksAssetsPathsParams) => Promise<string[]>;
}
