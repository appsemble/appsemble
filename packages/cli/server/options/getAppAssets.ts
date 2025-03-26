import { createReadStream } from 'node:fs';

import { type AppAsset, type GetAppSubEntityParams } from '@appsemble/node-utils';

export function getAppAssets({ context }: GetAppSubEntityParams): Promise<AppAsset[]> {
  return Promise.resolve(
    // @ts-expect-error 2345 argument of type is not assignable to parameter of type
    // (strictNullChecks)
    context.appAssets.map((asset) => ({ ...asset, stream: createReadStream(asset.filename) })),
  );
}
