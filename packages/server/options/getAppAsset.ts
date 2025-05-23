import {
  type AppAsset,
  assertKoaCondition,
  type GetAppAssetParams,
  getS3File,
} from '@appsemble/node-utils';

import { Asset } from '../models/index.js';

export async function getAppAsset({
  app,
  context: ctx,
  id: assetId,
}: GetAppAssetParams): Promise<AppAsset> {
  const asset =
    (await Asset.findOne({
      where: {
        AppId: app.id,
        id: assetId,
        ...(app.demoMode ? { seed: false, ephemeral: true } : {}),
      },
    })) ??
    (await Asset.findOne({
      where: {
        AppId: app.id,
        name: assetId,
        ...(app.demoMode ? { seed: false, ephemeral: true } : {}),
      },
    }));
  assertKoaCondition(asset != null, ctx, 404, 'Asset not found');
  // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
  return { ...asset, stream: await getS3File(`app-${app.id}`, assetId) };
}
