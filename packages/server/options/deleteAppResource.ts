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
  const persistedApp = (await App.findOne({
    where: {
      id: app.id,
    },
  }))!;

  const resource = await Resource.findOne({
    where: { id, type, AppId: app.id, ...whereOptions },
  });

  // @ts-expect-error 2345 argument of type is not assignable to parameter of type
  // (strictNullChecks)
  processReferenceHooks(persistedApp, resource, 'delete', options, context);
  // @ts-expect-error 2345 argument of type is not assignable to parameter of type
  // (strictNullChecks)
  processHooks(persistedApp, resource, 'delete', options, context);

  // @ts-expect-error 2345 argument of type is not assignable to parameter of type
  // (strictNullChecks)
  await processReferenceTriggers(persistedApp, resource, 'delete', context);

  // @ts-expect-error 18048 variable is possibly null (strictNullChecks)
  return resource.destroy();
}
