import { logger } from '@appsemble/node-utils';
import FormData from 'form-data';
import fs from 'fs-extra';
import yaml from 'js-yaml';
import { join } from 'path';

import processCss from './processCss';
import { post } from './request';

/**
 *
 * @param {string} path
 * @param {FormData} formData
 */
async function traverseAppDirectory(path, formData) {
  logger.info('Traversing directory for App files 🕵');
  const dir = await fs.readdir(path);

  if (!dir.includes('app.yaml')) {
    logger.error('No file named “app.yaml” found, aborting');
    return false;
  }

  const data = await fs.readFile(join(path, 'app.yaml'), 'utf8');
  const app = yaml.safeLoad(data);
  formData.append('yaml', data);
  formData.append('definition', JSON.stringify(app));

  const icon = dir.find(entry => entry.match(/icon\.(png|svg)/));
  if (icon) {
    logger.info('Including icon');
    formData.append('icon', fs.createReadStream(join(path, icon)));
  }

  const theme = dir.find(entry => entry.toLowerCase() === 'theme');
  if (theme) {
    const themeDir = (await fs.readdir(join(path, theme))).filter(sub =>
      fs.lstatSync(join(path, theme, sub)).isDirectory(),
    );

    const core = themeDir.find(entry => entry.toLowerCase() === 'core');
    const shared = themeDir.find(entry => entry.toLowerCase() === 'shared');

    if (core) {
      const coreDir = await fs.readdir(join(path, theme, core));
      const coreCss = coreDir.find(file => file.toLowerCase() === 'index.css');
      if (coreCss) {
        logger.info('Including core style');
        const css = await processCss(join(path, theme, core, coreCss));
        formData.append('style', Buffer.from(css));
      } else {
        logger.warn('Found core style directory but couldn‘t find “index.css”, skipping');
      }
    }

    if (shared) {
      const sharedDir = await fs.readdir(join(path, theme, shared));
      const sharedCss = sharedDir.find(file => file.toLowerCase() === 'index.css');
      if (sharedCss) {
        logger.info('Including shared style');
        const css = await processCss(join(path, theme, shared, sharedCss));
        formData.append('sharedStyle', Buffer.from(css));
      } else {
        logger.warn('Found shared style directory but couldn‘t find “index.css”, skipping');
      }
    }
  }

  return true;
}

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
  try {
    const file = await fs.stat(path);
    const formData = new FormData();
    formData.append('private', String(isPrivate));
    formData.append('template', String(template));
    formData.append('OrganizationId', organizationId);

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
