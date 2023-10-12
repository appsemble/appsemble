import { type DeleteAppResourceParams } from '@appsemble/node-utils';

import { App, Resource, type User } from '../models/index.js';
import {
  processHooks,
  processReferenceHooks,
  processReferenceTriggers,
} from '../utils/resource.js';

export async function deleteAppResource({
  action,
  app,
  context,
  id,
  options,
  type,
  whereOptions,
}: DeleteAppResourceParams): Promise<void> {
  const { user } = context;

  const persistedApp = await App.findOne({
    where: {
      id: app.id,
    },
  });

  const resource = await Resource.findOne({
    where: { id, type, AppId: app.id, ...whereOptions },
  });

  processReferenceHooks(user as User, persistedApp, resource, action, options, context);
  processHooks(user as User, persistedApp, resource, action, options, context);

  await processReferenceTriggers(persistedApp, resource, action, context);

  return resource.destroy();
}
