import { type AppAsset, type GetAppAssetParams } from '@appsemble/node-utils';

export function getAppAsset({ context, id: filename }: GetAppAssetParams): Promise<AppAsset> {
  const assetFound = context.appAssets.find((asset) => asset.filename === filename);
  return Promise.resolve(assetFound);
}
