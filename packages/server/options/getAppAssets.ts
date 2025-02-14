import { type AppAsset, type GetAppSubEntityParams, getS3File } from '@appsemble/node-utils';

import { Asset } from '../models/index.js';

export async function getAppAssets({ app }: GetAppSubEntityParams): Promise<AppAsset[]> {
  const assets = await Asset.findAll({
    attributes: ['id', 'name', 'ResourceId'],
    where: {
      AppId: app.id,
      ...(app.demoMode ? { seed: false, ephemeral: true } : {}),
    },
  });
  return Promise.all(
    assets.map(async (asset) => ({
      id: asset.id,
      name: asset.name,
      mime: asset.mime,
      resourceId: asset.ResourceId,
      stream: await getS3File(`app-${app.id}`, asset.id),
    })),
  );
}
