import { readFile } from 'node:fs/promises';

import { type AppAsset, type GetAppSubEntityParams } from '@appsemble/node-utils';

export function getAppAssets({ context }: GetAppSubEntityParams): Promise<AppAsset[]> {
  const assetPromises = context.appAssets.map(async (asset) => {
    const data = await readFile(asset.filename);
    return {
      ...asset,
      data,
    };
  });

  return Promise.all(assetPromises);
}
