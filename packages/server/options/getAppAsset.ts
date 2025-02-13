import {
  type AppAsset,
  assertKoaError,
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
  assertKoaError(!asset, ctx, 404, 'Asset not found');
  return { ...asset, stream: await getS3File(`app-${app.id}`, assetId) };
}
