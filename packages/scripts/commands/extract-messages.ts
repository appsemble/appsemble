import { join } from 'node:path';

import { logger, writeData } from '@appsemble/node-utils';

import { extractMessages } from '../lib/i18n.js';

export const command = 'extract-messages';
export const description = 'Extract new messages for currently supported locales';

export async function handler(): Promise<void> {
  const translations = await extractMessages();
  await Promise.all(
    Object.entries(translations).map(([locale, messages]) => {
      logger.info(`Updating messages for ${locale}`);
      return writeData(join('i18n', `${locale}.json`), messages, { compare: null });
    }),
  );
  logger.info('Updated messages');
}
