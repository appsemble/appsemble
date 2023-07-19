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

  const [organization, blockName] = parseBlockName(name);

  if (filename) {
    let stylePath;

    if (existsSync(join(process.cwd(), 'blocks', blockName))) {
      const blockConfig = blockConfigs.find((config) => config.name === name);
      stylePath = `${blockConfig.dir}/${blockConfig.output}/${filename}`;
    } else {
      const cacheDir = await globalCacheDir('appsemble');
      stylePath = join(
        cacheDir,
        'blocks',
        organization,
        blockName,
        block.version,
        'assets',
        filename,
      );
    }

    const style = await processCss(stylePath);
    return [{ style }];
  }

  return [];
}
