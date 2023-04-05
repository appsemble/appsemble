import { GetAppResourcesParams } from '@appsemble/node-utils/server/types.js';
import { Resource as ResourceInterface } from '@appsemble/types';

import { Resource } from '../models/Resource.js';

export const getAppResources = ({
  query,
  type,
}: GetAppResourcesParams): Promise<ResourceInterface[] | []> => Resource.findAll(query, type);
