import { readFile } from 'node:fs/promises';

import { type AppAsset, type GetAppAssetParams } from '@appsemble/node-utils';

export function getAppAsset({ context, id: filename }: GetAppAssetParams): Promise<AppAsset> {
  const assetFound = context.appAssets.find((asset) => asset.filename === filename);
  const assetPromise = async (): Promise<AppAsset> => {
    const data = await readFile(assetFound.filename);
    return {
      ...assetFound,
      data,
    };
  };

  return Promise.resolve(assetPromise());
}
