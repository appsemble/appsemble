import { DeleteAppAssetParams } from '@appsemble/node-utils/server/types';

import { Asset } from '../models/index.js';

export const deleteAppAsset = ({ id, transaction }: DeleteAppAssetParams): Promise<number> =>
  Asset.destroy({ where: { id }, transaction });
