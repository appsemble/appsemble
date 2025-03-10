import { createReadStream } from 'node:fs';

import { type AppAsset, type GetAppSubEntityParams } from '@appsemble/node-utils';

export function getAppAssets({ context }: GetAppSubEntityParams): Promise<AppAsset[]> {
  return Promise.resolve(
    context.appAssets.map((asset) => ({ ...asset, stream: createReadStream(asset.filename) })),
  );
}
