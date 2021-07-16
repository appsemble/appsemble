import { createReadStream, promises as fs } from 'fs';
import { basename, join, relative, resolve } from 'path';
import { inspect } from 'util';

import { AppsembleError, logger, opendirSafe } from '@appsemble/node-utils';
import { BlockConfig } from '@appsemble/types';
import { compareStrings } from '@appsemble/utils';
import FormData from 'form-data';
import { readJSON } from 'fs-extra';

import { getBlockConfigFromTypeScript } from './getBlockConfigFromTypeScript';

/**
 * Configure the payload for a new block version upload.
 *
 * @param config - The block configuration
 * @returns The payload that should be sent to the version endpoint.
 */
export async function makePayload(config: BlockConfig): Promise<FormData> {
  const { dir, output } = config;
  const distPath = resolve(dir, output);
  const form = new FormData();
  const { description, layout, longDescription, name, version } = config;
  const { actions, events, messages, parameters } = getBlockConfigFromTypeScript(config);
  const files = await fs.readdir(dir);
  const icon = files.find((entry) => entry.match(/^icon\.(png|svg)$/));

  function append(field: string, value: any): void {
    if (value) {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      logger.verbose(`Using ${field}: ${inspect(value, { colors: true, depth: 20 })}`);
      form.append(field, serialized);
    } else {
      logger.silly(`Skipping parameter ${field}`);
    }
  }

  append('actions', actions);
  append('description', description);
  append('longDescription', longDescription);
  append('events', events);
  append('layout', layout);
  append('name', name);
  append('parameters', parameters);
  append('version', version);

  if (icon) {
    const iconPath = join(dir, icon);
    logger.info(`Using icon: ${iconPath}`);
    form.append('icon', createReadStream(iconPath));
  }

  if (messages) {
    if (!files.includes('i18n')) {
      throw new AppsembleError(
        'This block has messages defined, but the message files could not be found. Try running extract-messages',
      );
    }

    const messageKeys = Object.keys(messages).sort(compareStrings);
    const messagesResult: Record<string, Record<string, string>> = {};
    const messagesPath = join(dir, 'i18n');

    const translations = (await fs.readdir(messagesPath)).map((language) => language.toLowerCase());
    if (!translations.includes('en.json')) {
      throw new AppsembleError('Could not find ‘en.json’. Try running extract-messages');
    }

    const duplicates = translations.filter(
      (language, index) => translations.indexOf(language) !== index,
    );

    if (duplicates.length) {
      throw new AppsembleError(`Found duplicate language codes: ‘${duplicates.join('’, ')}`);
    }

    for (const languageFile of translations.filter((t) => t.endsWith('.json'))) {
      const language = basename(languageFile, '.json');
      const languagePath = join(messagesPath, languageFile);
      const m: Record<string, string> = await readJSON(languagePath);
      const languageKeys = Object.keys(m).sort(compareStrings);

      if (
        languageKeys.length !== messageKeys.length ||
        languageKeys.some((key) => !messageKeys.includes(key))
      ) {
        throw new AppsembleError(
          `‘${languagePath}’ contains mismatching message keys. Try running extract-messages`,
        );
      }

      logger.info(`Including ${language} translations from ‘${languagePath}’`);
      messagesResult[language] = m;
    }

    form.append('messages', JSON.stringify(messagesResult));
  }

  await opendirSafe(
    distPath,
    (fullpath, stat) => {
      if (!stat.isFile()) {
        return;
      }
      const relativePath = relative(distPath, fullpath);
      const realPath = relative(process.cwd(), fullpath);
      logger.info(`Adding file: “${realPath}” as “${relativePath}”`);
      form.append('files', createReadStream(fullpath), {
        filename: encodeURIComponent(relativePath),
      });
    },
    { recursive: true },
  );

  return form;
}
