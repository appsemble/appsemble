import {
  type AppAsset,
  assertKoaCondition,
  getAppAssetLocation,
  type GetAppAssetParams,
  getS3File,
} from '@appsemble/node-utils';

import { App, getAppDB } from '../models/index.js';

export async function getAppAsset({
  app,
  context: ctx,
  id: assetId,
}: GetAppAssetParams): Promise<AppAsset> {
  const { Asset } = await getAppDB(app.id!);
  const asset =
    (await Asset.findOne({
      where: {
        id: assetId,
        ...(app.demoMode ? { seed: false, ephemeral: true } : {}),
      },
    })) ??
    (await Asset.findOne({
      where: {
        name: assetId,
        ...(app.demoMode ? { seed: false, ephemeral: true } : {}),
      },
    }));
  assertKoaCondition(asset != null, ctx, 404, 'Asset not found');
  const owner = (await App.findByPk(app.id, { attributes: ['id', 's3Bucket'] }))!;
  const { bucket, key } = getAppAssetLocation(owner, asset.id);
  // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
  return { ...asset, stream: await getS3File(bucket, key) };
}
