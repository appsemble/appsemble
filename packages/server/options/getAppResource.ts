import { GetAppResourceParams } from '@appsemble/node-utils/server/types.js';
import { Resource as ResourceInterface } from '@appsemble/types';

import { Resource } from '../models/Resource.js';

export const getAppResource = async ({
  app,
  id,
  type,
  whereOptions,
}: GetAppResourceParams): Promise<ResourceInterface | null> => {
  const resource = await Resource.findOne({
    where: { id, type, AppId: app.id, ...whereOptions },
  });
  return resource.toJSON();
};
