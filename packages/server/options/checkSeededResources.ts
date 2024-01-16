import { type CheckSeededResourcesParams } from '@appsemble/node-utils';

import { Resource } from '../models/index.js';

export async function checkSeededResources({
  app,
  resourceType,
}: CheckSeededResourcesParams): Promise<boolean> {
  const existingResources = await Resource.findAll({
    attributes: ['id'],
    where: {
      AppId: app.id,
      type: resourceType,
      seed: true,
    },
  });

  return existingResources.length > 0;
}
