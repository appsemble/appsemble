import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { parseBlockName } from '@appsemble/lang-sdk';
import {
  type AppBlockStyle as AppBlockStyleInterface,
  type GetAppBlockStylesParams,
  opendirSafe,
} from '@appsemble/node-utils';

import { processCss } from '../../lib/processCss.js';

export async function getAppBlockStyles({
  context,
  name,
}: GetAppBlockStylesParams): Promise<AppBlockStyleInterface[]> {
  const { appPath } = context;

  const [, blockName] = parseBlockName(name);
  let style = '';

  const themeDirPath = join(appPath, 'theme');

  if (!existsSync(themeDirPath)) {
    return [{ style }];
  }

  await opendirSafe(join(appPath, 'theme'), async (themeDir, themeStat) => {
    const blockDir = join(themeDir, blockName);
    if (themeStat.name.startsWith('@') && existsSync(blockDir)) {
      await opendirSafe(blockDir, async (file) => {
        if (file.endsWith('.css')) {
          style = await processCss(join(file));
        }
      });
    }
  });

  return [{ style }];
}
