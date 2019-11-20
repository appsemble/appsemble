import { AppsembleError, logger } from '@appsemble/node-utils';
import FormData from 'form-data';
import fs from 'fs-extra';
import yaml from 'js-yaml';

import { post } from './request';
import traverseAppDirectory from './traverseAppDirectory';
import traverseBlockThemes from './traverseBlockThemes';

/**
 * Create a new App.
 *
 * @param {Object} params
 * @param {string} params.organizationId The ID of the organization to upload for.
 * @param {string} params.path The path in which the App YAML is located.
 * @param {boolean} params.private Whether the App should be marked as private.
 * @param {boolean} params.template Whether the App should be marked as a template.
 */
export default async function createApp({
  organizationId,
  path,
  remote,
  private: isPrivate,
  template,
}) {
  const file = await fs.stat(path);
  const formData = new FormData();
  formData.append('private', String(isPrivate));
  formData.append('template', String(template));
  formData.append('OrganizationId', organizationId);

  try {
    if (file.isFile()) {
      // Assuming file is App YAML
      const data = await fs.readFile(path, 'utf8');
      const app = yaml.safeLoad(data);
      formData.append('yaml', data);
      formData.append('definition', JSON.stringify(app));
    } else {
      await traverseAppDirectory(path, formData);
    }
  } catch (error) {
    if (error instanceof yaml.YAMLException) {
      throw new AppsembleError(`The YAML in ${path} is invalid.\nMessage: ${error.message}`);
    }
    throw error;
  }

  const response = await post('/api/apps', formData);

  if (file.isDirectory()) {
    // After uploading the app, upload block styles if they are available
    await traverseBlockThemes(path, response.id);
  }

  logger.info(`Successfully created App ${response.definition.name}! 🙌`);
  logger.info(`View App: ${remote}/@${organizationId}/${response.path}`);
  logger.info(`Edit App: ${remote}/apps/${response.id}/edit`);
}
