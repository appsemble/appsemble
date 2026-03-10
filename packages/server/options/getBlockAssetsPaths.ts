import { parseBlockName, prefixBlockURL } from '@appsemble/lang-sdk';
import { type GetBlocksAssetsPathsParams } from '@appsemble/node-utils';
import { Op } from 'sequelize';

import { BlockAsset, BlockVersion } from '../models/index.js';

export async function getBlocksAssetsPaths({
  identifiableBlocks,
}: GetBlocksAssetsPathsParams): Promise<string[]> {
  const blockManifests = await BlockVersion.findAll({
    attributes: ['name', 'OrganizationId', 'version', 'layout', 'actions', 'events'],
    include: [
      {
        attributes: ['filename'],
        model: BlockAsset,
        where: {
          BlockVersionId: { [Op.col]: 'BlockVersion.id' },
        },
      },
    ],
    where: {
      [Op.or]: identifiableBlocks.map(({ type, version }) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore-error 2488
        const [OrganizationId, name] = parseBlockName(type);
        return { name, OrganizationId, version };
      }),
    },
  });

  return blockManifests.flatMap((block) =>
    block.BlockAssets.filter((asset) => !asset.filename.endsWith('.map')).map((asset) =>
      prefixBlockURL(
        { type: `@${block.OrganizationId}/${block.name}`, version: block.version },
        asset.filename,
      ),
    ),
  );
}
