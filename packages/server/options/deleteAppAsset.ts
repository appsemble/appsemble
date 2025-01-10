import { type DeleteAppAssetParams, deleteS3File } from '@appsemble/node-utils';

import { Asset } from '../models/index.js';

export async function deleteAppAsset({
  app: { id: AppId },
  id,
  transaction,
}: DeleteAppAssetParams): Promise<number> {
  await deleteS3File(`app-${AppId}`, id);
  return Asset.destroy({ where: { id }, transaction });
}
