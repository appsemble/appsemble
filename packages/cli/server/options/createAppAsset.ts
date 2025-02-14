import { createReadStream } from 'node:fs';

import { type AppAsset, type CreateAppAssetParams } from '@appsemble/node-utils';

export function createAppAsset({ context, payload }: CreateAppAssetParams): Promise<AppAsset> {
  const { filename, mime, name, path } = payload;

  const asset: AppAsset = {
    id: name,
    mime,
    name,
    filename,
    stream: createReadStream(path),
  };

  context.appAssets.push(asset);
  return Promise.resolve(asset);
}
