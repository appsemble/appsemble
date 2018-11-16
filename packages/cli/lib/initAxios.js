import axios from 'axios';
import logging from 'winston';

/**
 * Configure the default axios URL.
 *
 * @param {Object} argv
 * @param {string} argv.remote The URL to make requests to.
 */
export default function initAxios({ remote }) {
  axios.defaults.baseURL = remote;
  logging.debug(`Request remote set to ${remote}`);
}
