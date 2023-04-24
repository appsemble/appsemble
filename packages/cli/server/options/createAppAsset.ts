import { writeFile } from 'node:fs/promises';

import { AppAsset, CreateAppAssetParams } from '@appsemble/node-utils/server/types';

export const createAppAsset = async ({
  context,
  payload,
}: CreateAppAssetParams): Promise<AppAsset> => {
  const { data, filename, mime, name } = payload;

  const asset = {
    id: name,
    data,
    mime,
    name,
    filename,
  };

  context.appAssets.push(asset);

  await writeFile(filename, data);

  return asset;
};
