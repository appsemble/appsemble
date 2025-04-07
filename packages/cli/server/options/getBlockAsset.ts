import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { parseBlockName } from '@appsemble/lang-sdk';
import { type GetBlockAssetParams, type ProjectAsset } from '@appsemble/node-utils';
import globalCacheDir from 'global-cache-dir';
import { lookup } from 'mime-types';

export async function getBlockAsset({
  context,
  filename,
  name,
  version,
}: GetBlockAssetParams): Promise<ProjectAsset> {
  const { blockConfigs } = context;

  // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
  // @ts-ignore 2488 [...] | undefined must have a '[Symbol.iterator]()'
  const [organisation, blockName] = parseBlockName(name);

  if (existsSync(join(process.cwd(), 'blocks', blockName))) {
    const blockConfig = blockConfigs.find((block) => block.name === name);

    // @ts-expect-error 18048 variable is possibly undefined (strictNullChecks)
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
