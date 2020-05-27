import { logger } from '@appsemble/node-utils';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import FormData from 'form-data';
import { Stream } from 'stream';
import { URLSearchParams } from 'url';

/**
 * An {@link axios} request interceptor to add support for {@link form-data}.
 *
 * @param config The axios request configuration.
 * @returns The config with additional `multipart/form-data` headers if appropriate.
 */
export function formData(config: AxiosRequestConfig): AxiosRequestConfig {
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
export function requestLogger(config: AxiosRequestConfig): AxiosRequestConfig {
  logger.info(`Start ${config.method.toUpperCase()} ${axios.getUri(config)}`);
  if (config.data) {
    if (config.data instanceof URLSearchParams) {
      logger.silly(`Request body: ${config.data}`);
    } else if (config.data instanceof Stream) {
      logger.silly('Request body: Stream');
    } else {
      logger.silly(`Request body: ${JSON.stringify(config.data)}`);
    }
  }
  return config;
}

/**
 * An {@link axios} response interceptor to log responses.
 *
 * @param response The axios response.
 * @returns The original response.
 */
export function responseLogger(response: AxiosResponse): AxiosResponse {
  logger.info(`Success ${response.config.method.toUpperCase()} ${axios.getUri(response.config)}`);
  if (response.data instanceof Stream) {
    logger.silly('Response body: Stream');
  } else {
    logger.silly(`Response body: ${JSON.stringify(response.data)}`);
  }
  return response;
}
