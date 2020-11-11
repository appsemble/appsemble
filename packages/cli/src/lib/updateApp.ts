import { promises as fs } from 'fs';
import { URL } from 'url';

import { logger } from '@appsemble/node-utils';
import axios from 'axios';
import FormData from 'form-data';
import yaml from 'js-yaml';

import { UpdateAppArguments } from '../types';
import { traverseAppDirectory } from './traverseAppDirectory';
import { traverseBlockThemes } from './traverseBlockThemes';
import { uploadMessages } from './uploadMessages';

/**
 * Create a new App.
 *
 * @param argv - The command line options used for updating the app.
 */
export async function updateApp({
  appId,
  path,
  private: isPrivate,
  remote,
  template,
}: UpdateAppArguments): Promise<void> {
  try {
    const file = await fs.stat(path);
    const formData = new FormData();
    formData.append('private', String(isPrivate));
    formData.append('template', String(template));

    if (file.isFile()) {
      // Assuming file is App YAML
      const data = await fs.readFile(path, 'utf8');
      const app = yaml.safeLoad(data);
      formData.append('yaml', data);
      formData.append('definition', JSON.stringify(app));
    } else {
      await traverseAppDirectory(path, formData);
    }

    const { data } = await axios.patch(`/api/apps/${appId}`, formData);

    if (file.isDirectory()) {
      // After uploading the app, upload block styles and messages if they are available
      await traverseBlockThemes(path, data.id);
      await uploadMessages(path, data.id);
    }

    const { host, protocol } = new URL(remote);
    logger.info(`Successfully updated app ${data.definition.name}! 🙌`);
    logger.info(`App URL: ${protocol}//${data.path}.${data.OrganizationId}.${host}`);
    logger.info(`App store page: ${new URL(`/apps/${data.id}`, remote)}`);
  } catch (error: unknown) {
    if (error instanceof yaml.YAMLException) {
      logger.error(error);
      logger.error(`The YAML in ${path} is invalid.`);
      logger.error(`Message: ${error.message}`);
      return;
    }

    throw error;
  }
}
