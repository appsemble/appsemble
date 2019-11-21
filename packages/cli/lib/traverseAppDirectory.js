import { AppsembleError, logger } from '@appsemble/node-utils';
import fs from 'fs-extra';
import yaml from 'js-yaml';
import { join } from 'path';

import processCss from './processCss';

/**
 * Traverses an app directory and appends the files it finds to the given FormData object.
 *
 * @param {string} path The path of the app directory to traverse.
 * @param {FormData} formData The FormData object to append the results into.
 */
export default async function traverseAppDirectory(path, formData) {
  logger.info('Traversing directory for App files 🕵');
  const dir = await fs.readdir(path);

  if (!dir.includes('app.yaml')) {
    throw new AppsembleError(`No file named “app.yaml” found at ${path}`);
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
        formData.append('style', Buffer.from(css), coreCss);
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
        formData.append('sharedStyle', Buffer.from(css), sharedCss);
      } else {
        logger.warn('Found shared style directory but couldn‘t find “index.css”, skipping');
      }
    }
  }
}
