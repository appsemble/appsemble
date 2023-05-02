import { AppAsset, GetAppSubEntityParams } from '@appsemble/node-utils/server/types';

import { Asset } from '../models/index.js';

export const getAppAssets = async ({ app }: GetAppSubEntityParams): Promise<AppAsset[]> => {
  const assets = await Asset.findAll({
    where: {
      AppId: app.id,
    },
  });
  return assets.map((asset) => ({
    ...asset,
    id: asset.id,
    resourceId: asset.ResourceId,
  })) as AppAsset[];
};
