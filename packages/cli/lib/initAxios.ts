import { configureAxios, logger, version } from '@appsemble/node-utils';
import axios from 'axios';

import { type BaseArguments } from '../types.js';

/**
 * Configure the default axios URL.
 *
 * @param argv The parsed command line arguments.
 */
export function initAxios({ remote }: BaseArguments): void {
  axios.defaults.baseURL = remote;
  logger.verbose(`Request remote set to ${remote}`);
  configureAxios('AppsembleCLI', version);
}
