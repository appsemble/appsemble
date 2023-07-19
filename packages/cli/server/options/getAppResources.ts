import { type GetAppResourcesParams } from '@appsemble/node-utils';
import { type Resource as ResourceInterface } from '@appsemble/types';

import { Resource } from '../models/Resource.js';

export function getAppResources({
  findOptions,
  type,
}: GetAppResourcesParams): Promise<ResourceInterface[] | []> {
  return Resource.findAll(findOptions, type);
}
