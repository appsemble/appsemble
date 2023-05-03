import { type DeleteAppResourceParams } from '@appsemble/node-utils';

import { App, Resource } from '../models/index.js';
import { processHooks, processReferenceHooks } from '../utils/resource.js';

export async function deleteAppResource({
  action,
  app,
  context,
  id,
  options,
  type,
  whereOptions,
}: DeleteAppResourceParams): Promise<void> {
  const persistedApp = await App.findOne({
    where: {
      id: app.id,
    },
  });

  const resource = await Resource.findOne({
    where: { id, type, AppId: app.id, ...whereOptions },
  });

  processReferenceHooks(context.user, persistedApp, resource, action, options, context);
  processHooks(context.user, persistedApp, resource, action, options, context);

  return resource.destroy();
}
