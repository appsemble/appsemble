import { type DeleteAppAssetParams } from '@appsemble/node-utils';

import { Asset } from '../models/index.js';

export function deleteAppAsset({ id, transaction }: DeleteAppAssetParams): Promise<number> {
  return Asset.destroy({ where: { id }, transaction });
}
