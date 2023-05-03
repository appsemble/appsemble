import { type GetAppResourceParams } from '@appsemble/node-utils';
import { type Resource as ResourceInterface } from '@appsemble/types';

import { Resource } from '../models/Resource.js';

export function getAppResource({
  id,
  type,
}: GetAppResourceParams): Promise<ResourceInterface | null> {
  return Resource.findById(id, type);
}
