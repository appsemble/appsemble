import { type GetAppResourcesParams } from '@appsemble/node-utils';
import { type Resource as ResourceInterface } from '@appsemble/types';

import { getAppDB } from '../models/index.js';
import { mapKeysRecursively } from '../utils/sequelize.js';

export async function getAppResources({
  app,
  findOptions,
}: GetAppResourcesParams): Promise<ResourceInterface[]> {
  const { attributes, ...clearOptions } = findOptions;
  const { Resource } = await getAppDB(app.id!);
  const resources = await Resource.findAll({
    ...clearOptions,
    where: mapKeysRecursively(clearOptions.where),
    include: [
      { association: 'Author', attributes: ['id', 'name'], required: false },
      { association: 'Editor', attributes: ['id', 'name'], required: false },
      { association: 'Group', attributes: ['id', 'name'], required: false },
    ],
  });
  return resources.map((resource) =>
    resource.toJSON({
      include: attributes,
      exclude: app.template ? ['$seed'] : undefined,
    }),
  );
}
