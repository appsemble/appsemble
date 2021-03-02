import { existsSync, promises as fs } from 'fs';
import { join, parse } from 'path';

import { logger } from '@appsemble/node-utils';
import { AppMessages } from '@appsemble/types';
import axios from 'axios';
import yaml from 'js-yaml';

export async function uploadMessages(path: string, appId: string, remote: string): Promise<void> {
  if (!existsSync(join(path, 'messages'))) {
    return;
  }

  const messageDir = await fs.readdir(join(path, 'messages'));

  if (messageDir.length === 0) {
    return;
  }

  logger.info(`Traversing app messages for ${messageDir.length} languages 🕵`);
  const result: AppMessages[] = [];

  for (const messageFile of messageDir) {
    logger.verbose(`Processing ${join(path, 'messages', messageFile)} ⚙️`);
    const language = parse(messageFile).name;
    const file = await fs.readFile(join(path, 'messages', messageFile), 'utf8');
    const messages = yaml.safeLoad(file);
    result.push({ language, messages } as AppMessages);
  }

  for (const language of result) {
    await axios.post(`/api/apps/${appId}/messages`, language, { baseURL: remote });
    logger.info(`Successfully uploaded messages for language “${language.language}” 🎉`);
  }
}
