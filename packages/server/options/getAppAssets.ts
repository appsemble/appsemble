import { type AppAsset, type GetAppSubEntityParams } from '@appsemble/node-utils';

import { Asset } from '../models/index.js';

export async function getAppAssets({ app }: GetAppSubEntityParams): Promise<AppAsset[]> {
  const assets = await Asset.findAll({
    where: {
      AppId: app.id,
      ...(app.demoMode ? { seed: false, ephemeral: true } : {}),
    },
  });
  return assets.map((asset) => ({
    ...asset,
    id: asset.id,
    resourceId: asset.ResourceId,
  })) as AppAsset[];
}
