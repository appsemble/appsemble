import { logger } from '@appsemble/node-utils';
import FormData from 'form-data';
import fs from 'fs-extra';
import yaml from 'js-yaml';

import { post } from './request';

/**
 * Create a new App.
 *
 * @param {Object} params
 * @param {string} params.organizationId The ID of the organization to upload for.
 * @param {string} params.path The path in which the App YAML is located.
 * @param {boolean} params.private Whether the App should be marked as private.
 */
export default async function createApp({ organizationId, path, private: isPrivate, remote }) {
  try {
    const data = await fs.readFile(path, 'utf8');
    const app = yaml.safeLoad(data);
    const formData = new FormData();
    formData.append('private', String(isPrivate));
    formData.append('OrganizationId', organizationId);
    formData.append('yaml', data);
    formData.append('definition', JSON.stringify(app));

    const response = await post('/api/apps', formData);
    logger.info(`Successfully created App ${response.definition.name}! 🙌`);
    logger.info(`View App: ${remote}/@${organizationId}/${response.path}`);
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
