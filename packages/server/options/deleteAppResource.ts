import { type DeleteAppResourceParams } from '@appsemble/node-utils';

import { App, getAppDB } from '../models/index.js';
import { lockResourceWithIfMatch } from '../utils/optimisticResourceLock.js';
import {
  processHooks,
  processReferenceHooks,
  processReferenceTriggers,
} from '../utils/resource.js';
import { mapKeysRecursively } from '../utils/sequelize.js';

export async function deleteAppResource({
  app,
  context,
  id,
  ifMatch,
  lockWhere,
  options,
  type,
  whereOptions,
}: DeleteAppResourceParams): Promise<void> {
  const { Resource, sequelize } = await getAppDB(app.id!);
  const persistedApp = (await App.findOne({ where: { id: app.id } }))!;

  const mappedLockWhere = lockWhere ? mapKeysRecursively(lockWhere) : { id, type, ...whereOptions };

  await sequelize.transaction(async (transaction) => {
    const locked = await lockResourceWithIfMatch({
      context,
      transaction,
      Resource,
      where: mappedLockWhere,
      ifMatch,
      resourceType: type,
      resourceId: id,
    });

    processReferenceHooks(persistedApp, locked, 'delete', options, context);
    processHooks(persistedApp, locked, 'delete', options, context);

    await processReferenceTriggers(persistedApp, locked, 'delete', context);

    await locked.destroy({ transaction });
  });
}
