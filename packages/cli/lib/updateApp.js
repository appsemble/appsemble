import { logger } from '@appsemble/node-utils';
import FormData from 'form-data';
import fs from 'fs-extra';
import yaml from 'js-yaml';

import { patch } from './request';
import traverseAppDirectory from './traverseAppDirectory';
import traverseBlockThemes from './traverseBlockThemes';

/**
 * Create a new App.
 *
 * @param {Object} params
 * @param {number} params.appId The ID of the app to update.
 * @param {string} params.path The path in which the app YAML is located.
 * @param {boolean} params.private Whether the app should be marked as private.
 * @param {boolean} params.template Whether the app should be marked as a template.
 */
export default async function updateApp({ appId, path, remote, private: isPrivate, template }) {
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
      const result = await traverseAppDirectory(path, formData);
      if (!result) {
        // No App file found
        return;
      }
    }

    const response = await patch(`/api/apps/${appId}`, formData);

    if (file.isDirectory()) {
      // After uploading the app, upload block styles if they are available
      await traverseBlockThemes(path, response.id);
    }

    logger.info(`Successfully updated App ${response.definition.name}! 🙌`);
    logger.info(`View App: ${remote}/@${response.OrganizationId}/${response.path}`);
    logger.info(`Edit App: ${remote}/apps/${response.id}/edit`);
  } catch (error) {
    if (error instanceof yaml.YAMLException) {
      logger.error(`The YAML in ${path} is invalid.`);
      logger.error(`Message: ${error.message}`);
      return;
    }

    throw error;
  }
}
