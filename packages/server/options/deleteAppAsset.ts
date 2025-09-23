import { type DeleteAppAssetParams, deleteS3File } from '@appsemble/node-utils';

import { getAppDB } from '../models/index.js';

export async function deleteAppAsset({
  app: { id: AppId },
  id,
  transaction,
}: DeleteAppAssetParams): Promise<number> {
  const { Asset } = await getAppDB(AppId!);
  await deleteS3File(`app-${AppId}`, id);
  return Asset.destroy({ where: { id }, transaction });
}
