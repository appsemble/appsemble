import { type GetAppResourcesParams } from '@appsemble/node-utils';
import { type Resource as ResourceInterface } from '@appsemble/types';

import { Resource } from '../models/Resource.js';
import { mapKeysRecursively } from '../utils/sequelize.js';

export async function getAppResources({
  findOptions,
}: GetAppResourcesParams): Promise<ResourceInterface[]> {
  const { attributes, ...clearOptions } = findOptions;
  const resources = await Resource.findAll({
    ...clearOptions,
    where: mapKeysRecursively(clearOptions.where),
    include: [
      { association: 'Author', attributes: ['id', 'name'], required: false },
      { association: 'Editor', attributes: ['id', 'name'], required: false },
    ],
  });
  return resources.map((resource) => resource.toJSON({ include: attributes }));
}
