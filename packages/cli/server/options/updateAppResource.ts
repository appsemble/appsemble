import {
  createResourceEtag,
  matchesResourceIfMatch,
  throwResourcePreconditionFailedKoaError,
  type UpdateAppResourceParams,
} from '@appsemble/node-utils';
import { type Resource as ResourceInterface } from '@appsemble/types';

import { Resource } from '../models/Resource.js';

export async function updateAppResource({
  context,
  id,
  ifMatch,
  resource,
  type,
}: UpdateAppResourceParams): Promise<ResourceInterface | null> {
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
}
