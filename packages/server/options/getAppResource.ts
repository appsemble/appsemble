import { type GetAppResourceParams } from '@appsemble/node-utils';
import { type Resource as ResourceInterface } from '@appsemble/types';

import { Resource } from '../models/Resource.js';
import { mapKeysRecursively } from '../utils/sequelize.js';

export async function getAppResource({
  findOptions,
}: GetAppResourceParams): Promise<ResourceInterface | null> {
  const resource = await Resource.findOne({
    ...findOptions,
    where: mapKeysRecursively(findOptions.where),
    include: [
      { association: 'Author', attributes: ['id', 'name'], required: false },
      { association: 'Editor', attributes: ['id', 'name'], required: false },
    ],
  });

  return resource ? resource.toJSON() : null;
}
