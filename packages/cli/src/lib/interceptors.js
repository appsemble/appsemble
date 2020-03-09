import { logger } from '@appsemble/node-utils';
import axios from 'axios';
import FormData from 'form-data';

/**
 * An {@link axios} request interceptor to add support for {@link form-data}.
 *
 * @param config The axios request configuration.
 * @returns The config with additional `multipart/form-data` headers if appropriate.
 */
export function formData(config) {
  if (config.data instanceof FormData) {
    Object.assign(config.headers, config.data.getHeaders());
  }
  return config;
}

/**
 * An {@link axios} request interceptor to log requests.
 *
 * @param config The axios request configuration.
 * @returns The original config.
 */
export function requestLogger(config) {
  logger.info(`Start ${config.method.toUpperCase()} ${axios.getUri(config)}`);
  if (config.data) {
    logger.silly(`Request body: ${JSON.stringify(config.data)}`);
  }
  return config;
}

/**
 * An {@link axios} response interceptor to log responses.
 *
 * @param response The axios response.
 * @returns The original response.
 */
export function responseLogger(response) {
  logger.info(`Success ${response.config.method.toUpperCase()} ${axios.getUri(response.config)}`);
  logger.silly(`Response body: ${JSON.stringify(response.data)}`);
  return response;
}
