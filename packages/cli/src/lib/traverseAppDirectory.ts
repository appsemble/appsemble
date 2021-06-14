import { createReadStream, promises as fs } from 'fs';
import { join, resolve } from 'path';
import { inspect } from 'util';

import { AppsembleError, logger, opendirSafe, readYaml } from '@appsemble/node-utils';
import FormData from 'form-data';

import { AppsembleContext, AppsembleRC } from '../types';
import { processCss } from './processCss';

/**
 * Traverses an app directory and appends the files it finds to the given FormData object.
 *
 * @param path - The path of the app directory to traverse.
 * @param context - The Context to use from `.appsemblerc.yaml`.
 * @param formData - The FormData object to append the results into..
 * @returns The context from `.appsemblerc.yaml` if a match was found.
 */
export async function traverseAppDirectory(
  path: string,
  context: string,
  formData: FormData,
): Promise<AppsembleContext> {
  let appFound: string;
  let discoveredContext: AppsembleContext;
  let iconPath: string;
  let maskableIconPath: string;

  logger.info(`Traversing directory for App files in ${path} 🕵`);
  await opendirSafe(path, async (filepath, stat) => {
    switch (stat.name.toLowerCase()) {
      case '.appsemblerc.yaml': {
        logger.info(`Reading app settings from ${filepath}`);
        const [rc] = await readYaml<AppsembleRC>(filepath);
        if ('iconBackground' in rc) {
          formData.append('iconBackground', rc.iconBackground);
        }
        if (context && 'context' in rc && Object.hasOwnProperty.call(rc.context, context)) {
          discoveredContext = rc.context[context];
          logger.verbose(`Using context: ${inspect(discoveredContext, { colors: true })}`);
        }
        break;
      }

      case 'app.yaml': {
        logger.info(`Using app definition from ${filepath}`);
        if (appFound) {
          throw new AppsembleError('Found duplicate app definition');
        }
        appFound = filepath;

        const [app, data] = await readYaml(filepath);
        formData.append('yaml', data);
        formData.append('definition', JSON.stringify(app));
        return;
      }

      case 'icon.png':
      case 'icon.svg':
        iconPath = filepath;
        return;

      case 'maskable-icon.png':
        maskableIconPath = filepath;
        return;

      case 'readme.md':
        logger.info(`Including longDescription from ${filepath}`);
        formData.append('longDescription', await fs.readFile(filepath, 'utf8'));
        return;

      case 'screenshots':
        return opendirSafe(
          filepath,
          (screenshotPath, screenshotStat) => {
            logger.info(`Adding screenshot ${screenshotPath} 🖼️`);
            if (!screenshotStat.isFile()) {
              throw new AppsembleError(`Expected ${screenshotPath} to be an image file`);
            }
            formData.append('screenshots', createReadStream(screenshotPath));
          },
          { allowMissing: true },
        );

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
          formData.append(`${name}Style`, Buffer.from(css), `${name}.css`);
        });

      default:
        logger.warn(`Found unused file ${filepath}`);
    }
  });
  if (!appFound) {
    throw new AppsembleError('No app definition found');
  }
  discoveredContext ||= {};
  discoveredContext.icon = discoveredContext.icon
    ? resolve(path, discoveredContext.icon)
    : iconPath;
  discoveredContext.maskableIcon ||= maskableIconPath;
  return discoveredContext;
}
