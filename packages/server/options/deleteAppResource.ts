import { type DeleteAppResourceParams } from '@appsemble/node-utils';

import { App, Resource } from '../models/index.js';
import {
  processHooks,
  processReferenceHooks,
  processReferenceTriggers,
} from '../utils/resource.js';

export async function deleteAppResource({
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

  processReferenceHooks(persistedApp, resource, 'delete', options, context);
  processHooks(persistedApp, resource, 'delete', options, context);

  await processReferenceTriggers(persistedApp, resource, 'delete', context);

  return resource.destroy();
}
