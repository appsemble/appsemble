import { logger } from '@appsemble/node-utils';
import axios from 'axios';
import * as os from 'os';

import { version } from '../../package.json';
import { BaseArguments } from '../types';
import { formData, requestLogger, responseLogger } from './interceptors';

/**
 * Configure the default axios URL.
 */
export default function initAxios({ remote }: BaseArguments): void {
  axios.defaults.baseURL = remote;
  logger.verbose(`Request remote set to ${remote}`);
  axios.defaults.headers.common[
    'user-agent'
  ] = `AppsembleCLI/${version} (${os.type()} ${os.arch()}; Node ${process.version})`;
  axios.interceptors.request.use(formData);
  axios.interceptors.request.use(requestLogger);
  axios.interceptors.response.use(responseLogger);
}
