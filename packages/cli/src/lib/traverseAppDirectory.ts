import { createReadStream, promises as fs } from 'fs';
import { join } from 'path';

import { AppsembleError, logger } from '@appsemble/node-utils';
import type FormData from 'form-data';
import yaml from 'js-yaml';

import { opendirSafe } from '../utils/fs';
import { processCss } from './processCss';

/**
 * Traverses an app directory and appends the files it finds to the given FormData object.
 *
 * @param path - The path of the app directory to traverse.
 * @param formData - The FormData object to append the results into.
 */
export async function traverseAppDirectory(path: string, formData: FormData): Promise<void> {
  let appFound: string;

  logger.info(`Traversing directory for App files in ${path} 🕵`);
  await opendirSafe(path, async (filepath, stat) => {
    switch (stat.name.toLowerCase()) {
      case 'app.yaml': {
        logger.info(`Using app definition from ${filepath}`);
        if (appFound) {
          throw new AppsembleError('Found duplicate app definition');
        }
        appFound = filepath;

        const data = await fs.readFile(filepath, 'utf8');
        const app = yaml.safeLoad(data);
        formData.append('yaml', data);
        formData.append('definition', JSON.stringify(app));
        return;
      }

      case 'icon.png':
      case 'icon.svg':
        logger.info(`Including icon ${filepath}`);
        formData.append('icon', createReadStream(filepath));
        return;

      case 'theme':
        return opendirSafe(filepath, async (themeDir, themeStat) => {
          const name = themeStat.name.toLowerCase();
          if (name !== 'core' && name !== 'shared') {
            return;
          }
          if (!themeStat.isDirectory()) {
            throw new AppsembleError(`Expected ${themeDir} to be a directory`);
          }
          const css = await processCss(join(themeDir, 'index.css'));
          formData.append(name, Buffer.from(css), `${name}.css`);
        });

      default:
        logger.warn(`Found unused file ${filepath}`);
    }
  });
  if (!appFound) {
    throw new AppsembleError('No app definition found');
  }
}
