import { basename, join } from 'node:path';

import { opendirSafe } from '@appsemble/node-utils';
import { GetBlocksAssetsPathsParams } from '@appsemble/node-utils/types';
import { prefixBlockURL } from '@appsemble/utils';

export const getBlocksAssetsPaths = async ({
  context,
  identifiableBlocks,
}: GetBlocksAssetsPathsParams): Promise<string[]> => {
  const { blockConfigs } = context;

  const blockAssetsPaths: string[] = [];

  const blockAssetsPathsPromises = identifiableBlocks.flatMap(async (identifiableBlock) => {
    const blockConfig = blockConfigs.find((config) => config.name === identifiableBlock.type);

    await opendirSafe(
      join(blockConfig.dir, blockConfig.output),
      (fullPath, stat) => {
        if (!stat.isFile()) {
          return;
        }
        const filename = basename(fullPath);

        if (!filename.endsWith('.map')) {
          blockAssetsPaths.push(prefixBlockURL(identifiableBlock, filename));
        }
      },
      { recursive: true },
    );
    return blockAssetsPaths;
  });

  await Promise.all(blockAssetsPathsPromises);

  return blockAssetsPaths;
};
