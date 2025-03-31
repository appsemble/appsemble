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

  // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
  return BlockAsset.findOne({
    attributes: ['mime', 'content'],
    where: { filename },
    include: [
      {
        model: BlockVersion,
        where: { name: blockId, version, OrganizationId: org.slice(1) },
      },
    ],
  });
}
