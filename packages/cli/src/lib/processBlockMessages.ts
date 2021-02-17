import { join } from 'path';

import { logger } from '@appsemble/node-utils';
import { BlockConfig } from '@appsemble/types';
import { ensureDir, readdir, readJSON } from 'fs-extra';

import { getBlockConfigFromTypeScript } from './getBlockConfigFromTypeScript';

export async function processBlockMessages(
  config: BlockConfig,
  languages: string[],
): Promise<void> {
  const path = join(config.dir, 'i18n');
  await ensureDir(path);
  const dir = await readdir(path);
  const block = getBlockConfigFromTypeScript(config);
  logger.info(block);

  for (const language of languages) {
    const existingMessages = {};
    const name = `${language}.json`;
    const langPath = join(path, name);

    if (dir.includes(name)) {
      const m = await readJSON(langPath);
      Object.assign(existingMessages, m);
    }

    logger.info(existingMessages);
  }
}
