import { type DeleteAppAssetParams } from '@appsemble/node-utils';

import { Asset } from '../models/index.js';
import { deleteFile } from '../utils/s3.js';

export async function deleteAppAsset({
  app: { id: AppId },
  id,
  transaction,
}: DeleteAppAssetParams): Promise<number> {
  await deleteFile(`app-${AppId}`, id);
  return Asset.destroy({ where: { id }, transaction });
}
