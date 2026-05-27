import {
  createResourceEtag,
  type DeleteAppResourceParams,
  matchesResourceIfMatch,
  throwResourcePreconditionFailedKoaError,
} from '@appsemble/node-utils';

import { Resource } from '../models/Resource.js';
import { withResourceLock } from '../utils/resourceLock.js';

export function deleteAppResource({
  context,
  id,
  ifMatch,
  type,
}: DeleteAppResourceParams): Promise<void> {
  return withResourceLock(type, id, async () => {
    if (ifMatch) {
      const existing = await Resource.findById(id, type);
      if (
        existing &&
        !matchesResourceIfMatch(ifMatch, createResourceEtag(existing as Record<string, unknown>))
      ) {
        throwResourcePreconditionFailedKoaError(context, type, id);
      }
    }
    return Resource.deleteOne(id, type);
  });
}
