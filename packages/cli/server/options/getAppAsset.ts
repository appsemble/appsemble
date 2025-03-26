import { createReadStream } from 'node:fs';

import { type AppAsset, type GetAppAssetParams } from '@appsemble/node-utils';

export function getAppAsset({ context, id: filename }: GetAppAssetParams): Promise<AppAsset> {
  const assetFound = context.appAssets.find((asset) => asset.name === filename);
  // @ts-expect-error 2345 argument of type is not assignable to parameter of type
  // (strictNullChecks)
  return Promise.resolve({ ...assetFound, stream: createReadStream(assetFound.filename) });
}
