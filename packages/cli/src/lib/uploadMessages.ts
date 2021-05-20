import { join, parse } from 'path';

import { AppsembleError, logger, opendirSafe, readYaml } from '@appsemble/node-utils';
import { AppsembleMessages, Messages } from '@appsemble/types';
import axios from 'axios';
import { readJson } from 'fs-extra';

/**
 * Upload messages for an app.
 *
 * @param path - The path to the app directory.
 * @param appId - The app id to upload the messages for.
 * @param remote - The remote to upload the messages to.
 * @param force - Whether or not to force the update for locked apps.
 */
export async function uploadMessages(
  path: string,
  appId: string,
  remote: string,
  force: boolean,
): Promise<void> {
  const result: Messages[] = [];

  logger.info('Searching for translations 🕵');
  await opendirSafe(
    join(path, 'i18n'),
    async (messageFile) => {
      logger.verbose(`Processing ${messageFile} ⚙️`);
      const { ext, name: language } = parse(messageFile);
      let messages: AppsembleMessages = {
        core: {},
        app: {},
        blocks: {},
        messageIds: {},
      };

      if (result.some((entry) => entry.language === language)) {
        throw new AppsembleError(
          `Found duplicate language “${language}”. Make sure each language only exists once in the directory.`,
        );
      }

      if (ext === 'json') {
        messages = await readJson(messageFile);
      } else {
        [messages] = await readYaml<AppsembleMessages>(messageFile);
      }
      result.push({ force, language, messages });
    },
    { allowMissing: true },
  );

  if (!result.length) {
    logger.info('No translations found 🤷');
  }

  for (const language of result) {
    await axios.post(`/api/apps/${appId}/messages`, language, { baseURL: remote });
    logger.info(`Successfully uploaded messages for language “${language.language}” 🎉`);
  }
}
