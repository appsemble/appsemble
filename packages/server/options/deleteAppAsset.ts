import { type DeleteAppAssetParams } from '@appsemble/node-utils';

import { Asset } from '../models/index.js';

export function deleteAppAsset({
  app: { id: AppId },
  context,
  id,
  transaction,
}: DeleteAppAssetParams): Promise<number> {
  context.assetsCache.del(`${AppId}-${id}`);
  return Asset.destroy({ where: { id }, transaction });
}
