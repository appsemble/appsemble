import { rm } from 'node:fs/promises';
import { join } from 'node:path';

import { logger } from '@appsemble/node-utils';
import { DeleteAppAssetParams } from '@appsemble/node-utils/server/types';

export const deleteAppAsset = async ({ app, id }: DeleteAppAssetParams): Promise<number> => {
  try {
    await rm(join(process.cwd(), '/apps/', app.definition.name, '/assets/', id));
    return 1;
  } catch (error) {
    logger.error(`An error occurred while deleting asset ${id} of app ${app.definition.name}`);
    logger.error(error);
    return 0;
  }
};
