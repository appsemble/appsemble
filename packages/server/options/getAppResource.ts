import { type GetAppResourceParams } from '@appsemble/node-utils';
import { type Resource as ResourceInterface } from '@appsemble/types';

import { Resource } from '../models/Resource.js';
import { mapKeysRecursively } from '../utils/sequelize.js';

export async function getAppResource({
  findOptions,
}: GetAppResourceParams): Promise<ResourceInterface | null> {
  const { where, ...clearOptions } = findOptions;

  const resource = await Resource.findOne({
    ...clearOptions,
    where: mapKeysRecursively(where),
    include: [
      { association: 'Author', attributes: ['id', 'name'], required: false },
      { association: 'Editor', attributes: ['id', 'name'], required: false },
      { association: 'Group', attributes: ['id', 'name'], required: false },
    ],
  });

  return resource ? resource.toJSON() : null;
}
