import { createReadStream, promises as fs, lstatSync } from 'fs';
import { join } from 'path';

import { AppsembleError, logger } from '@appsemble/node-utils';
import type FormData from 'form-data';
import yaml from 'js-yaml';

import { processCss } from './processCss';

/**
 * Traverses an app directory and appends the files it finds to the given FormData object.
 *
 * @param path - The path of the app directory to traverse.
 * @param formData - The FormData object to append the results into.
 */
export async function traverseAppDirectory(path: string, formData: FormData): Promise<void> {
  logger.info(`Traversing directory for App files in ${path} 🕵`);
  const dir = await fs.readdir(path);

  if (!dir.includes('app.yaml')) {
    throw new AppsembleError(`No file named “app.yaml” found at ${path}`);
  }

  const yamlPath = join(path, 'app.yaml');
  logger.info(`Using app definition from ${yamlPath}`);

  const data = await fs.readFile(yamlPath, 'utf8');
  const app = yaml.safeLoad(data);
  formData.append('yaml', data);
  formData.append('definition', JSON.stringify(app));

  const icon = dir.find((entry) => entry.match(/^icon\.(png|svg)$/));
  if (icon) {
    const iconPath = join(path, icon);
    logger.info(`Including icon ${iconPath}`);
    formData.append('icon', createReadStream(iconPath));
  }

  const theme = dir.find((entry) => entry.toLowerCase() === 'theme');
  if (theme) {
    const themeDir = (await fs.readdir(join(path, theme))).filter((sub) =>
      lstatSync(join(path, theme, sub)).isDirectory(),
    );

    const core = themeDir.find((entry) => entry.toLowerCase() === 'core');
    const shared = themeDir.find((entry) => entry.toLowerCase() === 'shared');

    if (core) {
      const coreDir = await fs.readdir(join(path, theme, core));
      const coreCss = coreDir.find((file) => file.toLowerCase() === 'index.css');
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
      const sharedCss = sharedDir.find((file) => file.toLowerCase() === 'index.css');
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
