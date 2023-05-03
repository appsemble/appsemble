import { type UpdateAppResourceParams } from '@appsemble/node-utils';
import { type Resource as ResourceInterface } from '@appsemble/types';

import { Resource } from '../models/Resource.js';

export function updateAppResource({
  id,
  resource,
  type,
}: UpdateAppResourceParams): Promise<ResourceInterface | null> {
  return Resource.updateOne(id, resource, type);
}
