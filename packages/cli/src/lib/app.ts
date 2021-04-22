import { existsSync, promises as fs } from 'fs';
import { join } from 'path';
import { inspect } from 'util';

import { AppsembleError, logger, opendirSafe, readYaml, writeYaml } from '@appsemble/node-utils';
import { AppDefinition } from '@appsemble/types';
import { extractAppMessages, has } from '@appsemble/utils';

/**
 * @param path - The path to the app directory.
 * @param languages - A list of languages for which translations should be added in addition to the
 * existing ones.
 * @param verify - If true, an error will be thrown if translations are missing.
 */
export async function writeAppMessages(
  path: string,
  languages: string[],
  verify: boolean,
): Promise<void> {
  logger.info(`Extracting messages from ${path}`);
  let app: AppDefinition;
  let i18nDir = join(path, 'i18n');
  const messageFiles: string[] = [];

  await opendirSafe(path, async (filepath, stat) => {
    switch (stat.name.toLowerCase()) {
      case 'app.yaml': {
        [app] = await readYaml<AppDefinition>(filepath);
        break;
      }
      case 'i18n': {
        // For case insensitivity
        i18nDir = filepath;
        const i18nFiles = await fs.readdir(filepath);
        messageFiles.push(...i18nFiles.map((f) => join(filepath, f)));
        break;
      }
      default:
        break;
    }
  });
  if (!app) {
    throw new AppsembleError(`Couldn’t find app definition for ${path}`);
  }
  // Ensure the i18n directory exists.
  await fs.mkdir(i18nDir, { recursive: true });

  messageFiles.push(...languages.map((lang) => join(i18nDir, `${lang}.yaml`)));
  const messageIds = extractAppMessages(app);
  logger.verbose(`Found message IDs: ${inspect(messageIds)}`);
  for (const filepath of messageFiles) {
    logger.info(`Processing ${filepath}`);
    let oldMessages: Record<string, string>;
    if (existsSync(filepath)) {
      [oldMessages] = await readYaml<Record<string, string>>(filepath);
    } else if (verify) {
      throw new AppsembleError(`Missing translations file: ${filepath}`);
    } else {
      oldMessages = {};
    }
    const newMessages = Object.fromEntries(
      messageIds.map((key) => {
        if (has(oldMessages, key) && oldMessages[key]) {
          if (typeof oldMessages[key] !== 'string') {
            throw new AppsembleError(`Invalid translation key: ${key}`);
          }
          return [key, oldMessages[key]];
        }
        if (verify) {
          throw new AppsembleError(`Missing translation key: ${key}`);
        }
        return [key, ''];
      }),
    );
    await writeYaml(filepath, newMessages, { sortKeys: true });
  }
}
