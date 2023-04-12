import { GetAppResourcesParams } from '@appsemble/node-utils/server/types.js';
import { Resource as ResourceInterface } from '@appsemble/types';

import { Resource } from '../models/Resource.js';

export const getAppResources = ({
  findOptions,
  type,
}: GetAppResourcesParams): Promise<ResourceInterface[] | []> => Resource.findAll(findOptions, type);
