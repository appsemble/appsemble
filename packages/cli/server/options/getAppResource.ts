import { GetAppResourceParams } from '@appsemble/node-utils/server/types.js';
import { Resource as ResourceInterface } from '@appsemble/types';

import { Resource } from '../models/Resource.js';

export const getAppResource = ({
  id,
  type,
}: GetAppResourceParams): Promise<ResourceInterface | null> => Resource.findById(id, type);
