import { logger } from '@appsemble/node-utils';
import axios from 'axios';
import os from 'os';

import { version } from '../../package.json';
import { formData, requestLogger, responseLogger } from './interceptors';

/**
 * Configure the default axios URL.
 *
 * @param {Object} argv
 * @param {string} argv.remote The URL to make requests to.
 */
export default function initAxios({ remote }) {
  axios.defaults.baseURL = remote;
  logger.verbose(`Request remote set to ${remote}`);
  axios.defaults.headers.common[
    'user-agent'
  ] = `AppsembleCLI/${version} (${os.type()} ${os.arch()}; Node ${process.version})`;
  axios.interceptors.request.use(formData);
  axios.interceptors.request.use(requestLogger);
  axios.interceptors.response.use(responseLogger);
}
