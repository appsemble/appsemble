import { type GetAppSubEntityParams } from '@appsemble/node-utils';
import { type Asset as AppAsset } from '@appsemble/types';

import { Asset } from '../models/index.js';

export async function getAppAssets({ app }: GetAppSubEntityParams): Promise<AppAsset[]> {
  const assets = await Asset.findAll({
    attributes: ['id', 'name', 'ResourceId'],
    where: {
      AppId: app.id,
      ...(app.demoMode ? { seed: false, ephemeral: true } : {}),
    },
  });
  return assets.map((asset) => ({
    id: asset.id,
    name: asset.name,
    resourceId: asset.ResourceId,
  })) as AppAsset[];
}
