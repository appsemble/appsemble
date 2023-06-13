import { writeFile } from 'node:fs/promises';

import { type AppAsset, type CreateAppAssetParams } from '@appsemble/node-utils';

export async function createAppAsset({
  context,
  payload,
}: CreateAppAssetParams): Promise<AppAsset> {
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
}
