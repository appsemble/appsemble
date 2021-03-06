import { promises as fs } from 'fs';
import { parse } from 'path';

import { logger } from '@appsemble/node-utils';
import { defaultLocale } from '@appsemble/utils';
import extractMessages from 'extract-react-intl-messages';

export const command = 'extract-messages';
export const description = 'Extract new messages for currently supported locales';

export async function handler(): Promise<void> {
  const translationsDir = 'i18n';

  const filenames = await fs.readdir(translationsDir);
  const locales = filenames.map((filename) => parse(filename).name);

  logger.info(`Updating messages for ${locales.join(', ')}`);
  await extractMessages(locales, 'packages/*/src/**/messages.ts', translationsDir, {
    defaultLocale,
    overwriteDefault: true,
  });
  logger.info('Updated messages');
}
