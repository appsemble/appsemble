import { deleteAppAssetObjects, type DeleteAppAssetParams } from '@appsemble/node-utils';

import { App, getAppDB } from '../models/index.js';

export async function deleteAppAsset({
  app: { id: AppId },
  id,
  transaction,
}: DeleteAppAssetParams): Promise<number> {
  const { Asset } = await getAppDB(AppId!);
  const owner = (await App.findByPk(AppId, { attributes: ['id', 's3Bucket'] }))!;
  await deleteAppAssetObjects(owner, [id]);
  return Asset.destroy({ where: { id }, transaction });
}
