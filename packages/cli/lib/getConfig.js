import path from 'path';

import chalk from 'chalk';
import cosmiconfig from 'cosmiconfig';
import fs from 'fs-extra';
import logging from 'winston';

const explorer = cosmiconfig('appsemble');

/**
 * Get the block configuration from a block directory.
 *
 * @param {string} dir The directory in which to search for the configuration file.
 * @returns {Object} The block configuration.
 */
export default async function getConfig(dir) {
  const { config, filepath } = await explorer.search(dir, { stopDir: dir });
  logging.info(`Found configuration file: ${filepath}`);
  const pkg = await fs.readJSON(path.resolve(filepath, '../package.json'));
  if (!pkg.private) {
    logging.warn(
      `It is ${chalk.underline.yellow('highly recommended')} to set “${chalk.green(
        '"private"',
      )}: ${chalk.cyan('true')}” in package.json`,
    );
  }
  const result = { description: pkg.description, id: pkg.name, version: pkg.version, ...config };
  logging.debug('Resolved configuration:', result);
  return result;
}
