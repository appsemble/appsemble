import { logger } from '@appsemble/node-utils';
import fs from 'fs-extra';
import { join } from 'path';
import type { Promisable } from 'type-fest';

import uploadAppBlockTheme from './uploadAppBlockTheme';

/**
 * Traverses the directory at a given path for app block themes and uploads them.
 *
 * @param path The path of the app.
 * @param appId The ID of the app.
 */
export default async function traverseBlockThemes(path: string, appId: number): Promise<void> {
  if (!fs.existsSync(join(path, 'theme'))) {
    return;
  }

  const themeDir = (await fs.readdir(join(path, 'theme'))).filter(
    (sub) => fs.lstatSync(join(path, 'theme', sub)).isDirectory() && sub.startsWith('@'),
  );

  if (themeDir.length === 0) {
    return;
  }

  logger.info(`Traversing block themes for ${themeDir.length} organizations`);

  await themeDir.reduce<Promisable<void>>(async (acc, org) => {
    await acc;
    logger.info(`Traversing themes for organization ${org}`);
    const orgDir = (await fs.readdir(join(path, 'theme', org))).filter((sub) =>
      fs.lstatSync(join(path, 'theme', org, sub)).isDirectory(),
    );

    if (!orgDir.length) {
      logger.warn(`No subdirectories found in ${join(path, 'theme', ...orgDir)}, skipping`);
      return;
    }

    await orgDir.reduce<Promisable<void>>(async (accumulator, blockDir) => {
      await accumulator;
      const blockStyleDir = await fs.readdir(join(path, 'theme', org, blockDir));
      const indexCss = blockStyleDir.find((fname) => fname.toLowerCase() === 'index.css');
      if (!indexCss) {
        logger.warn(`No index.css found, skipping directory ${join(path, 'theme', org, blockDir)}`);
        return;
      }

      await uploadAppBlockTheme(join(path, 'theme', org, blockDir, indexCss), org, appId, blockDir);
    }, null);
  }, null);
}
