import { existsSync } from 'node:fs';
import { join } from 'node:path';

import {
  type AppBlockStyle as AppBlockStyleInterface,
  type GetAppBlockStylesParams,
} from '@appsemble/node-utils';
import { parseBlockName } from '@appsemble/utils';
import globalCacheDir from 'global-cache-dir';

import { processCss } from '../../lib/processCss.js';

export async function getAppBlockStyles({
  context,
  name,
}: GetAppBlockStylesParams): Promise<AppBlockStyleInterface[]> {
  const { appBlocks, blockConfigs } = context;

  const block = appBlocks.find((appBlock) => appBlock.name === name);
  const filename = block.files.find((file) => file.endsWith('.css'));

  const [organisation, blockName] = parseBlockName(name);

  if (existsSync(join(process.cwd(), 'blocks', blockName))) {
    const blockConfig = blockConfigs.find((config) => config.name === name);

    const stylePath = `${blockConfig.dir}/${blockConfig.output}/${filename}`;

    const style = filename ? await processCss(stylePath) : null;
    return [...(filename ? [{ style }] : [])];
  }

  const cacheDir = await globalCacheDir('appsemble');
  const stylePath = join(
    cacheDir,
    'blocks',
    organisation,
    blockName,
    block.version,
    'assets',
    filename,
  );

  const style = filename ? await processCss(stylePath) : null;
  return [...(filename ? [{ style }] : [])];
}
