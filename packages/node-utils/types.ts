import { App, Asset } from '@appsemble/types';
import { DefaultContext, DefaultState, ParameterizedContext } from 'koa';

interface AppGetParams {
  context: ParameterizedContext<DefaultState, DefaultContext, any>;
}

interface AppScreenshotsGetParams {
  app: App;
}

interface BlockAssetGetParams {
  filename: string;
  name: string;
  version: string;
}

export interface BlockAsset extends Asset {
  /**
   * The content of the asset file.
   */
  content: Buffer;
}

export interface AppScreenshot {
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

export interface AppRouterOptions {
  getApp: (params: AppGetParams) => Promise<App>;
  getAppScreenshots: (params: AppScreenshotsGetParams) => Promise<AppScreenshot[]>;
  getBlockAsset: (params: BlockAssetGetParams) => Promise<BlockAsset>;
}
