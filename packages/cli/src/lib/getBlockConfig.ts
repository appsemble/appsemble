import { existsSync, promises as fs } from 'fs';
import { join } from 'path';
import { inspect } from 'util';

import { AppsembleError, logger } from '@appsemble/node-utils';
import { cyan, green, underline } from 'chalk';
import { cosmiconfig } from 'cosmiconfig';
import { readJSON } from 'fs-extra';

import { BlockConfig } from '../types';

/**
 * Get the block configuration from a block directory.
 *
 * @param dir - The directory in which to search for the configuration file.
 * @returns The block configuration.
 */
export async function getBlockConfig(dir: string): Promise<BlockConfig> {
  const explorer = cosmiconfig('appsemble', { stopDir: dir });
  const found = await explorer.search(dir);
  if (!found) {
    throw new AppsembleError('No Appsemble configuration file found.');
  }
  const { config, filepath } = found;
  logger.info(`Found configuration file: ${filepath}`);
  const pkg = await readJSON(join(dir, 'package.json'));
  if (!pkg.private) {
    logger.warn(
      `It is ${underline.yellow('highly recommended')} to set “${green('"private"')}: ${cyan(
        'true',
      )}” in package.json`,
    );
  }
  let longDescription: string;
  if (existsSync(join(dir, 'README.md'))) {
    longDescription = await fs.readFile(join(dir, 'README.md'), 'utf8');
  }

  const result = {
    description: pkg.description,
    longDescription,
    name: pkg.name,
    version: pkg.version,
    webpack: 'webpack.config',
    ...config,
    dir,
  };
  logger.verbose(`Resolved block configuration: ${inspect(result, { colors: true })}`);
  return result;
}
