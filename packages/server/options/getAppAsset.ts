import { type AppAsset, assertKoaError, type GetAppAssetParams } from '@appsemble/node-utils';

import { Asset } from '../models/index.js';

export async function getAppAsset({
  app,
  context: ctx,
  id: assetId,
}: GetAppAssetParams): Promise<AppAsset> {
  const assets = await Asset.findAll({
    attributes: ['id', 'name', 'ResourceId'],
    where: {
      AppId: app.id,
      ...(app.demoMode ? { seed: false, ephemeral: true } : {}),
    },
  });
  // Pick asset id over asset name
  const asset = assets.find((a) => a.id === assetId) || assets.find((a) => a.name === assetId);
  assertKoaError(!asset, ctx, 404, 'Asset not found');
  return asset;
}
