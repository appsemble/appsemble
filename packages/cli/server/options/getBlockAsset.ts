import { readFile } from 'node:fs/promises';

import {
  BlockAsset as BlockAssetInterface,
  GetBlockAssetParams,
} from '@appsemble/node-utils/server/types';
import { lookup } from 'mime-types';

export const getBlockAsset = async ({
  context,
  filename,
  name,
}: GetBlockAssetParams): Promise<BlockAssetInterface> => {
  const { blockConfigs } = context;
  const blockConfig = blockConfigs.find((block) => block.name === name);

  const asset = await readFile(`${blockConfig.dir}/${filename}`);
  const mime = lookup(filename) || '';

  return {
    content: asset,
    mime,
  };
};
