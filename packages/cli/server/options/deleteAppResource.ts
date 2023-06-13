import { type DeleteAppResourceParams } from '@appsemble/node-utils';

import { Resource } from '../models/Resource.js';

export function deleteAppResource({ id, type }: DeleteAppResourceParams): Promise<void> {
  return Resource.deleteOne(id, type);
}
