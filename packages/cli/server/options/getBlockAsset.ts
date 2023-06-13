import { readFile } from 'node:fs/promises';

import {
  type BlockAsset as BlockAssetInterface,
  type GetBlockAssetParams,
} from '@appsemble/node-utils';
import { lookup } from 'mime-types';

export async function getBlockAsset({
  context,
  filename,
  name,
}: GetBlockAssetParams): Promise<BlockAssetInterface> {
  const { blockConfigs } = context;
  const blockConfig = blockConfigs.find((block) => block.name === name);

  const asset = await readFile(`${blockConfig.dir}/${blockConfig.output}/${filename}`);
  const mime = lookup(filename) || '';

  return {
    content: asset,
    mime,
  };
}
