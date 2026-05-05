import {
  type ProjectAsset as BlockAssetInterface,
  type GetBlockAssetParams,
} from '@appsemble/node-utils';

import { BlockAsset, BlockVersion } from '../models/index.js';

export function getBlockAsset({
  filename,
  name,
  version,
}: GetBlockAssetParams): Promise<BlockAssetInterface> {
  const [org, blockId] = name.split('/');
  const organizationId = org.slice(1);

  // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
  return BlockVersion.findOne({
    attributes: ['id'],
    where: { name: blockId, version, OrganizationId: organizationId },
  }).then((blockVersion) =>
    blockVersion
      ? BlockAsset.findOne({
          attributes: ['mime', 'content'],
          where: { filename, BlockVersionId: blockVersion.id },
        })
      : null,
  );
}
