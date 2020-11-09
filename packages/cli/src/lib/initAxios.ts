import { configureAxios, logger } from '@appsemble/node-utils';
import axios from 'axios';

import { BaseArguments } from '../types';
import { readPackageJson } from './readPackageJson';

/**
 * Configure the default axios URL.
 *
 * @param argv - The parsed command line arguments.
 */
export function initAxios({ remote }: BaseArguments): void {
  const { version } = readPackageJson();
  axios.defaults.baseURL = remote;
  logger.verbose(`Request remote set to ${remote}`);
  configureAxios('AppsembleCLI', version);
}
