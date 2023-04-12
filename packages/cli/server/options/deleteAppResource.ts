import { DeleteAppResourceParams } from '@appsemble/node-utils/server/types.js';

import { Resource } from '../models/Resource.js';

export const deleteAppResource = ({ id, type }: DeleteAppResourceParams): Promise<void> =>
  Resource.deleteOne(id, type);
