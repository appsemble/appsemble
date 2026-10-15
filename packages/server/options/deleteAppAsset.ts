import { deleteAppAssetObjects, type DeleteAppAssetParams } from '@appsemble/node-utils';

import { getAppDB } from '../models/index.js';

export async function deleteAppAsset({
  app: { id: AppId },
  id,
  transaction,
}: DeleteAppAssetParams): Promise<number> {
  const { Asset } = await getAppDB(AppId!);
  await deleteAppAssetObjects(AppId!, [id]);
  return Asset.destroy({ where: { id }, transaction });
}
