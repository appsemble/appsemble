import { promises as fs } from 'fs';
import { basename, join } from 'path';

import { logger, readData, writeData } from '@appsemble/node-utils';
import { BlockConfig } from '@appsemble/types';
import { compareStrings } from '@appsemble/utils';

import { getBlockConfigFromTypeScript } from './getBlockConfigFromTypeScript';

export async function processBlockMessages(
  config: BlockConfig,
  languages: string[],
): Promise<void> {
  const path = join(config.dir, 'i18n');
  await fs.mkdir(path, { recursive: true });
  const dir = await fs.readdir(path);
  const { messages } = getBlockConfigFromTypeScript(config);

  if (!messages) {
    logger.warn(`Block ${config.name} has no messages.`);
    return;
  }

  const keys = Object.keys(messages).sort(compareStrings);
  const base = Object.fromEntries(keys.map((key) => [key, '']));

  const existingLanguages = dir
    .filter((filename) => filename.endsWith('.json'))
    .map((filename) => basename(filename, '.json'));
  for (const language of [...new Set([...languages, ...existingLanguages])]) {
    const existingMessages = { ...base };
    const name = `${language}.json`;
    const langPath = join(path, name);

    if (dir.includes(name)) {
      const [m] = await readData<Record<string, string>>(langPath);
      Object.assign(existingMessages, m);
    }

    const extraKeys = Object.keys(existingMessages).filter((key) => !keys.includes(key));
    if (extraKeys.length) {
      logger.info(`Found ${extraKeys.length} keys too many. Removing: ${extraKeys.join(', ')}`);
      extraKeys.forEach((key) => delete existingMessages[key]);
    }

    await writeData(langPath, existingMessages);
    logger.info(`Wrote to file ‘${langPath}’`);
  }
  logger.info(`Finished extracting messages for ${config.name}.`);
  logger.info('');
}
