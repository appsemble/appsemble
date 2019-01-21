import { logger } from '@appsemble/node-utils';
import axios from 'axios';

/**
 * Configure the default axios URL.
 *
 * @param {Object} argv
 * @param {string} argv.remote The URL to make requests to.
 */
export default function initAxios({ remote }) {
  axios.defaults.baseURL = remote;
  logger.verbose(`Request remote set to ${remote}`);
}
