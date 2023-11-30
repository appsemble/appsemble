import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { type GetBlockAssetParams, type ProjectAsset } from '@appsemble/node-utils';
import { parseBlockName } from '@appsemble/utils';
import globalCacheDir from 'global-cache-dir';
import { lookup } from 'mime-types';

export async function getBlockAsset({
  context,
  filename,
  name,
  version,
}: GetBlockAssetParams): Promise<ProjectAsset> {
  const { blockConfigs } = context;

  const [organisation, blockName] = parseBlockName(name);

  if (existsSync(join(process.cwd(), 'blocks', blockName))) {
    const blockConfig = blockConfigs.find((block) => block.name === name);

    const asset = await readFile(`${blockConfig.dir}/${blockConfig.output}/${filename}`);
    const mime = lookup(filename) || '';

    return {
      content: asset,
      filename,
      mime,
    };
  }

  const cacheDir = await globalCacheDir('appsemble');
  const cachedAsset = join(
    cacheDir,
    'blocks',
    organisation,
    blockName,
    version,
    'assets',
    filename,
  );

  const asset = await readFile(cachedAsset);
  const mime = lookup(filename) || '';

  return {
    content: asset,
    filename,
    mime,
  };
}
