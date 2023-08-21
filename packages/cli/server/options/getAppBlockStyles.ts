import { existsSync } from 'node:fs';
import { join } from 'node:path';

import {
  type AppBlockStyle as AppBlockStyleInterface,
  type GetAppBlockStylesParams,
  opendirSafe,
} from '@appsemble/node-utils';
import { parseBlockName } from '@appsemble/utils';
import globalCacheDir from 'global-cache-dir';

import { processCss } from '../../lib/processCss.js';

export async function getAppBlockStyles({
  context,
  name,
}: GetAppBlockStylesParams): Promise<AppBlockStyleInterface[]> {
  const { appBlocks, appPath, blockConfigs } = context;

  const block = appBlocks.find((appBlock) => appBlock.name === name);
  const filename = block.files.find((file) => file.endsWith('.css'));

  const [organization, blockName] = parseBlockName(name);
  let styleString = '';

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
    styleString += style;
  }

  await opendirSafe(join(appPath, 'theme'), async (themeDir, themeStat) => {
    const blockDir = join(themeDir, blockName);
    if (themeStat.name.startsWith('@') && existsSync(blockDir)) {
      await opendirSafe(blockDir, async (file) => {
        if (file.endsWith('.css')) {
          const blockThemeStyle = await processCss(join(file));
          styleString += blockThemeStyle;
        }
      });
    }
  });

  return [{ style: styleString }];
}
