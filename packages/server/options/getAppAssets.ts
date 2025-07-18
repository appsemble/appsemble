import { type GetAppSubEntityParams } from '@appsemble/node-utils';
import { type Asset as AssetType } from '@appsemble/types';

import { getAppDB } from '../models/index.js';

export async function getAppAssets({ app }: GetAppSubEntityParams): Promise<AssetType[]> {
  const { Asset } = await getAppDB(app.id!);
  const assets = await Asset.findAll({
    attributes: ['id', 'name', 'ResourceId'],
    where: {
      ...(app.demoMode ? { seed: false, ephemeral: true } : {}),
    },
  });
  // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
  return assets.map((asset) => ({
    id: asset.id,
    name: asset.name,
    mime: asset.mime,
    resourceId: asset.ResourceId,
  }));
}
