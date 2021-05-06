import { existsSync, promises as fs } from 'fs';
import { join, parse } from 'path';
import { inspect } from 'util';

import { AppsembleError, logger, opendirSafe, readYaml, writeYaml } from '@appsemble/node-utils';
import { AppDefinition } from '@appsemble/types';
import { extractAppMessages, has } from '@appsemble/utils';
import { readJson } from 'fs-extra';

/**
 * @param path - The path to the app directory.
 * @param languages - A list of languages for which translations should be added in addition to the
 * existing ones.
 * @param verify - A list of languages to verify.
 * @param format - The file format that should be used for the output.
 */
export async function writeAppMessages(
  path: string,
  languages: string[],
  verify: string[],
  format: 'json' | 'yaml',
): Promise<void> {
  logger.info(`Extracting messages from ${path}`);
  let app: AppDefinition;
  let i18nDir = join(path, 'i18n');
  const messageFiles = new Set<string>();

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
        for (const f of i18nFiles) {
          messageFiles.add(join(filepath, f));
        }
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

  for (const lang of [...languages, ...verify]) {
    messageFiles.add(join(i18nDir, `${lang}.${format}`));
  }
  const defaultLangFile = join(i18nDir, `${app.defaultLanguage || 'en'}.${format}`);
  messageFiles.add(defaultLangFile);
  const extractedMessages = extractAppMessages(app);
  logger.verbose(`Found message IDs: ${inspect(extractedMessages)}`);
  for (const filepath of messageFiles) {
    logger.info(`Processing ${filepath}`);
    let oldMessages: Record<string, string>;
    if (existsSync(filepath)) {
      if (format === 'json') {
        oldMessages = await readJson(filepath);
      } else {
        [oldMessages] = await readYaml<Record<string, string>>(filepath);
      }
    } else if (verify) {
      throw new AppsembleError(`Missing translations file: ${filepath}`);
    } else {
      oldMessages = {};
    }
    const newMessages = Object.fromEntries(
      Object.entries(extractedMessages).map(([key, value]) => {
        if (has(oldMessages, key) && oldMessages[key]) {
          if (typeof oldMessages[key] !== 'string') {
            throw new AppsembleError(`Invalid translation key: ${key}`);
          }
          return [key, oldMessages[key]];
        }
        if (filepath === defaultLangFile) {
          return [key, value];
        }
        if (verify.includes(parse(filepath).name)) {
          throw new AppsembleError(`Missing translation key: ${key}`);
        }
        return [key, ''];
      }),
    );
    await writeYaml(filepath, newMessages, { sortKeys: true });
  }
}
