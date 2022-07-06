import { configureAxios, logger } from '@appsemble/node-utils';
import axios from 'axios';

import pkg from '../package.json';
import { BaseArguments } from '../types';

/**
 * Configure the default axios URL.
 *
 * @param argv - The parsed command line arguments.
 */
export function initAxios({ remote }: BaseArguments): void {
  axios.defaults.baseURL = remote;
  logger.verbose(`Request remote set to ${remote}`);
  configureAxios('AppsembleCLI', pkg.version);
}
