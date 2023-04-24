import { rm } from 'node:fs/promises';
import { DeleteAppAssetParams } from '@appsemble/node-utils/server/types';

export const deleteAppAsset = async ({ id, transaction }: DeleteAppAssetParams): Promise<number> => {
  Asset.destroy({ where: { id }, transaction });
  await rm(filename, data);
}
