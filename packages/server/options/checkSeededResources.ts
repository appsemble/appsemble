import { type CheckSeededResourcesParams } from '@appsemble/node-utils';

import { Resource } from '../models/index.js';

export async function checkSeededResources({
  app,
  resourceType,
}: CheckSeededResourcesParams): Promise<boolean> {
  const existingResourcesCount = await Resource.count({
    where: {
      AppId: app.id,
      type: resourceType,
      seed: true,
    },
  });

  return existingResourcesCount > 0;
}
