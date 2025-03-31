import { arch, type } from 'node:os';

import axios, { type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { highlight } from 'cli-highlight';
import FormData from 'form-data';

import { logger } from './logger.js';

/**
 * This is used to set a request id, so the request and response can be matched in the logs.
 */
const id = Symbol('id');

declare module 'axios' {
  interface AxiosRequestConfig {
    [id]?: number;
  }
}

/**
 * An {@link axios} request interceptor to add support for {@link form-data}.
 *
 * @param config The axios request configuration.
 * @returns The config with additional `multipart/form-data` headers if appropriate.
 */
export function formData(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
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
export function requestLogger(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
  const time = Date.now();
  logger.verbose(
    `> ${time} ${highlight(`${config.method?.toUpperCase()} ${axios.getUri(config)} HTTP/1.1`, {
      language: 'http',
    })}`,
  );
  // eslint-disable-next-line no-param-reassign
  config[id] = time;
  return config;
}

/**
 * An {@link axios} response interceptor to log responses.
 *
 * @param response The axios response.
 * @returns The original response.
 */
export function responseLogger(response: AxiosResponse): AxiosResponse {
  logger.verbose(
    `< ${response.config[id]} ${highlight(`HTTP/1.1 ${response.status} ${response.statusText}`, {
      language: 'http',
    })}`,
  );
  return response;
}

/**
 * Configure the default Axios instance.
 *
 * This applies the interceptors in this modules and sets the appropriate user agent string.
 *
 * @param name A PascalCase representation of the client.
 * @param version The version of the client to represent.
 */
export function configureAxios(name: string, version: string): void {
  const ua = `${name}/${version} (${type()} ${arch()}; Node ${process.version})`;
  axios.defaults.headers.common['user-agent'] = ua;

  axios.interceptors.request.use(formData);
  axios.interceptors.request.use(requestLogger);
  axios.interceptors.response.use(responseLogger);
}
