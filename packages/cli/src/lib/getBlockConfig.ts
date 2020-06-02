import { AppsembleError, logger } from '@appsemble/node-utils';
import chalk from 'chalk';
import { cosmiconfig } from 'cosmiconfig';
import fs from 'fs-extra';
import path from 'path';
import { inspect } from 'util';

import type { BlockConfig } from '../types';

/**
 * Get the block configuration from a block directory.
 *
 * @param dir The directory in which to search for the configuration file.
 * @returns The block configuration.
 */
export default async function getBlockConfig(dir: string): Promise<BlockConfig> {
  const explorer = cosmiconfig('appsemble', { stopDir: dir });
  const found = await explorer.search(dir);
  if (!found) {
    throw new AppsembleError('No Appsemble configuration file found.');
  }
  const { config, filepath } = found;
  logger.info(`Found configuration file: ${filepath}`);
  const pkg = await fs.readJSON(path.join(dir, 'package.json'));
  if (!pkg.private) {
    logger.warn(
      `It is ${chalk.underline.yellow('highly recommended')} to set “${chalk.green(
        '"private"',
      )}: ${chalk.cyan('true')}” in package.json`,
    );
  }
  let longDescription: string;
  if (await fs.pathExists(path.join(dir, 'README.md'))) {
    longDescription = await fs.readFile(path.join(dir, 'README.md'), 'utf8');
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
