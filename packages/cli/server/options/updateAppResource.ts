import { UpdateAppResourceParams } from '@appsemble/node-utils/server/types.js';
import { Resource as ResourceInterface } from '@appsemble/types';

import { Resource } from '../models/Resource.js';

export const updateAppResource = ({
  id,
  resource,
  type,
}: UpdateAppResourceParams): Promise<ResourceInterface | null> =>
  Resource.updateOne(id, resource, type);
