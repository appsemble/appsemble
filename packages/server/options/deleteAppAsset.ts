import { type DeleteAppAssetParams } from '@appsemble/node-utils';

import { Asset } from '../models/index.js';
import { assetsCache } from '../utils/assetCache.js';

export function deleteAppAsset({
  app: { id: AppId },
  id,
  transaction,
}: DeleteAppAssetParams): Promise<number> {
  assetsCache.del(`${AppId}-${id}`);
  return Asset.destroy({ where: { id }, transaction });
}
