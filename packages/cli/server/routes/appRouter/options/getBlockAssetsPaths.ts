import { GetBlocksAssetsPathsParams } from '@appsemble/node-utils/server/routes/types.js';
import { prefixBlockURL } from '@appsemble/utils';

export const getBlocksAssetsPaths = ({
  context,
}: GetBlocksAssetsPathsParams): Promise<string[]> => {
  const { appBlocks } = context;

  return Promise.resolve(
    appBlocks.flatMap((block) =>
      block.files
        .filter((filename) => !filename.endsWith('.map'))
        .map((filename) => prefixBlockURL({ type: block.name, version: block.version }, filename)),
    ),
  );
};
