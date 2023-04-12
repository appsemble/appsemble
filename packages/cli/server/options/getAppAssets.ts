import { readFile } from 'node:fs/promises';

import { AppAsset, GetAppSubEntityParams } from '@appsemble/node-utils/server/types';

export const getAppAssets = ({ context }: GetAppSubEntityParams): Promise<AppAsset[]> => {
  const assetPromises = context.appAssets.map(async (asset) => {
    const content = await readFile(asset.filename);
    return {
      ...asset,
      content,
    };
  });

  return Promise.all(assetPromises);
};
