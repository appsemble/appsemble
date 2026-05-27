import {
  createResourceEtag,
  matchesResourceIfMatch,
  throwResourcePreconditionFailedKoaError,
  type UpdateAppResourceParams,
} from '@appsemble/node-utils';
import { type Resource as ResourceInterface } from '@appsemble/types';

import { Resource } from '../models/Resource.js';
import { withResourceLock } from '../utils/resourceLock.js';

export function updateAppResource({
  context,
  id,
  ifMatch,
  resource,
  type,
}: UpdateAppResourceParams): Promise<ResourceInterface | null> {
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
    return Resource.updateOne(id, resource, type);
  });
}
