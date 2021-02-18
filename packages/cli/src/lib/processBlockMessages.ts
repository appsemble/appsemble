import { join } from 'path';

import { logger } from '@appsemble/node-utils';
import { BlockConfig } from '@appsemble/types';
import { ensureDir, readdir, readJSON, writeJSON } from 'fs-extra';

import { getBlockConfigFromTypeScript } from './getBlockConfigFromTypeScript';

export async function processBlockMessages(
  config: BlockConfig,
  languages: string[],
): Promise<void> {
  const path = join(config.dir, 'i18n');
  await ensureDir(path);
  const dir = await readdir(path);
  const { messages } = getBlockConfigFromTypeScript(config);

  if (!messages) {
    logger.warn(`Block ${config.name} has no messages.`);
    return;
  }

  const keys = Object.keys(messages).sort();
  const base = Object.fromEntries(keys.map((key) => [key, '']));

  for (const language of languages) {
    const existingMessages = { ...base };
    const name = `${language}.json`;
    const langPath = join(path, name);

    if (dir.includes(name)) {
      const m = await readJSON(langPath);
      Object.assign(existingMessages, m);
    }

    const extraKeys = Object.keys(existingMessages).filter((key) => !keys.includes(key));
    if (extraKeys.length) {
      logger.info(`Found ${extraKeys.length} keys too many. Removing: ${extraKeys.join(', ')}`);
      extraKeys.forEach((key) => delete existingMessages[key]);
    }

    await writeJSON(langPath, existingMessages, { spaces: 2 });
    logger.info(`Wrote to file ‘${langPath}’`);
  }
  logger.info(`Finished extracting messages for ${config.name}.`);
  logger.info('');
}
