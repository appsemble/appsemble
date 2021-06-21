import { existsSync, promises as fs } from 'fs';
import { join, parse } from 'path';
import { inspect } from 'util';

import { AppsembleError, logger, opendirSafe, readYaml, writeYaml } from '@appsemble/node-utils';
import { AppDefinition, AppsembleMessages } from '@appsemble/types';
import { extractAppMessages, has } from '@appsemble/utils';
import { readJson, writeJson } from 'fs-extra';

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
  const blockMessageKeys: AppsembleMessages['blocks'] = {};
  const extractedMessages = extractAppMessages(app, (block) => {
    const type = normalizeBlockName(block.type);
    if (blockMessageKeys[type]) {
      blockMessageKeys[type][block.version] = {};
    } else {
      blockMessageKeys[type] = {
        [block.version]: {},
      };
    }
  });
  logger.verbose(`Found message IDs: ${inspect(extractedMessages)}`);
  for (const filepath of messageFiles) {
    logger.info(`Processing ${filepath}`);
    let oldMessages: AppsembleMessages;
    if (existsSync(filepath)) {
      if (format === 'json') {
        oldMessages = await readJson(filepath);
      } else {
        [oldMessages] = await readYaml<AppsembleMessages>(filepath);
      }
    } else if (verify) {
      throw new AppsembleError(`Missing translations file: ${filepath}`);
    } else {
      oldMessages = {
        core: {},
        blocks: {},
        ...extractedMessages,
      };
    }

    const newMessageIds = Object.fromEntries(
      Object.keys(extractedMessages.messageIds).map((key) => {
        if (has(oldMessages.messageIds, key) && oldMessages.messageIds[key]) {
          if (typeof oldMessages.messageIds[key] !== 'string') {
            throw new AppsembleError(`Invalid translation key: messageIds.${key}`);
          }

          return [key, oldMessages.messageIds[key]];
        }

        if (verify.includes(parse(filepath).name)) {
          throw new AppsembleError(`Missing translation: messageIds.${key}`);
        }

        return [key, ''];
      }),
    );

    const newAppMessages = Object.fromEntries(
      Object.keys(extractedMessages.app).map((key) => {
        if (has(oldMessages.app, key) && oldMessages.app[key]) {
          if (typeof oldMessages.app[key] !== 'string') {
            throw new AppsembleError(`Invalid translation key: app.${key}`);
          }

          return [key, oldMessages.app[key]];
        }

        if (filepath === defaultLangFile) {
          return [key, extractedMessages.app[key]];
        }

        if (verify.includes(parse(filepath).name)) {
          throw new AppsembleError(`Missing translation: app.${key}`);
        }

        return [key, ''];
      }),
    );

    const coreMessages = oldMessages.core ?? {};
    for (const [key, value] of Object.entries(coreMessages)) {
      if (!value || typeof value !== 'string') {
        throw new AppsembleError(`Invalid translation key: core.${key}`);
      }
    }

    const blockMessages: AppsembleMessages['blocks'] = {};
    Object.keys(oldMessages.blocks ?? {}).forEach((key) => {
      if (!Object.keys(blockMessageKeys).includes(key)) {
        throw new AppsembleError(
          `Invalid translation key: blocks.${key}\nThis block is not used in the app`,
        );
      }
    });

    for (const [blockName] of Object.entries(blockMessageKeys)) {
      if (oldMessages.blocks?.[blockName]) {
        const currentVersionKeys = Object.keys(blockMessageKeys[blockName]);
        blockMessages[blockName] = {};

        for (const [version, oldValues] of Object.entries(oldMessages.blocks[blockName])) {
          if (!currentVersionKeys.includes(version)) {
            throw new AppsembleError(
              `Invalid translation key: blocks.${blockName}.${version}
This block version is not used in the app`,
            );
          }

          for (const [oldValueKey, oldValue] of Object.entries(
            oldMessages.blocks[blockName][version],
          )) {
            if (typeof oldValue !== 'string') {
              throw new AppsembleError(
                `Invalid translation key: blocks.${blockName}.${version}.${oldValueKey}`,
              );
            }

            if (verify.includes(parse(filepath).name) && !oldValue) {
              throw new AppsembleError(
                `Missing translation: blocks.${blockName}.${version}.${oldValueKey}`,
              );
            }
          }

          blockMessages[blockName][version] = oldValues;
        }
      }
    }

    const result = {
      app: newAppMessages,
      ...(Object.keys(newMessageIds).length && { messageIds: newMessageIds }),
      ...(Object.keys(blockMessages).length && { blocks: blockMessages }),
      ...(Object.keys(coreMessages).length && { core: coreMessages }),
    };

    await (format === 'yaml'
      ? writeYaml(filepath, result, { sortKeys: true })
      : writeJson(filepath, result, { spaces: 2 }));
  }
}
