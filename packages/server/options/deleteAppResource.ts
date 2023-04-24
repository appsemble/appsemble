import { DeleteAppResourceParams } from '@appsemble/node-utils/server/types.js';

import { App, Resource } from '../models/index.js';
import { processHooks, processReferenceHooks } from '../utils/resource.js';

export const deleteAppResource = async ({
  action,
  app,
  context,
  id,
  type,
  whereOptions,
}: DeleteAppResourceParams): Promise<void> => {
  const resource = await Resource.findOne({
    where: { id, type, AppId: app.id, ...whereOptions },
  });

  processReferenceHooks(context.user, { id: app.id } as App, resource, action);
  processHooks(context.user, { id: app.id } as App, resource, action);

  return resource.destroy();
};
