import { logger } from '@appsemble/node-utils';
import type { AppMessages } from '@appsemble/types';
import axios from 'axios';
import fs from 'fs-extra';
import yaml from 'js-yaml';
import { join } from 'path';

export default async function uploadMessages(path: string, appId: string): Promise<void> {
  if (!fs.existsSync(join(path, 'messages'))) {
    return;
  }

  const messageDir = await fs.readdir(join(path, 'messages'));

  if (messageDir.length === 0) {
    return;
  }

  logger.info(`Traversing app messages for ${messageDir.length} languages 🕵`);
  const result: { language: string; content: AppMessages }[] = [];

  for (const messageFile of messageDir) {
    logger.verbose(`Processing ${join(path, 'messages', messageFile)} ⚙️`);
    const [language] = messageFile.split('.');
    const file = await fs.readFile(join(path, 'messages', messageFile), 'utf8');
    const content = yaml.safeLoad(file) as AppMessages;
    result.push({ language, content });
  }

  for (const language of result) {
    await axios.post(`/api/apps/${appId}/translations`, language);
    logger.info(`Successfully uploaded messages for language “${language.language}” 🎉`);
  }
}
