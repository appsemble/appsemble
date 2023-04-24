import { readFile } from 'node:fs/promises';

import { AppAsset, GetAppSubEntityParams } from '@appsemble/node-utils/server/types';

export const getAppAssets = ({ context }: GetAppSubEntityParams): Promise<AppAsset[]> => {
  const assetPromises = context.appAssets.map(async (asset) => {
    const data = await readFile(asset.filename);
    return {
      ...asset,
      data,
    };
  });

  return Promise.all(assetPromises);
};
