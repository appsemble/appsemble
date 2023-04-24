import { GetAppResourcesParams } from '@appsemble/node-utils/server/types';
import { Resource as ResourceInterface } from '@appsemble/types';

import { Resource } from '../models/Resource.js';
import { parseWhereRecursively } from '../utils/sequelize.js';

export const getAppResources = async ({
  findOptions,
}: GetAppResourcesParams): Promise<ResourceInterface[]> => {
  const resources = await Resource.findAll({
    ...findOptions,
    include: [
      { association: 'Author', attributes: ['id', 'name'], required: false },
      { association: 'Editor', attributes: ['id', 'name'], required: false },
    ],
    where: parseWhereRecursively(findOptions),
  });

  return resources.map((resource) => resource.toJSON());
};
