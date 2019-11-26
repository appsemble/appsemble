import { logger } from '@appsemble/node-utils';
import axios from 'axios';
import FormData from 'form-data';

/**
 * Make an HTTP request using Axios.
 *
 * @param {Request} req The Axios request.
 */
export default async function request(req) {
  logger.info(`Start ${req.method.toUpperCase()} ${req.url}`);
  logger.silly(`Request body: ${JSON.stringify(req.body)}`);
  const { data } = await axios(req);
  logger.info(`Success ${req.method.toUpperCase()} ${req.url}`);
  logger.verbose(`Response body: ${JSON.stringify(data)}`);
  return data;
}

/**
 * Make an HTTP POST request.
 *
 * @param {string} url The URL endpoint to make the POST request to.
 * @param data The data to send. If this is a `FormData` instance, headers will be handled
 *   automatically.
 * @param {Object} headers The HTTP request headers to send.
 * @returns The response body.
 * @throws If the request failed, or a bad HTTP status code was returned.
 */
export function post(url, data, headers = {}) {
  if (data instanceof FormData) {
    Object.assign(headers, data.getHeaders());
  }
  return request({ method: 'post', url, data, headers });
}

/**
 * Make an HTTP PATCH request.
 *
 * @param {string} url The URL endpoint to make the PATCH request to.
 * @param data The data to send. If this is a `FormData` instance, headers will be handled
 *   automatically.
 * @param {Object} headers The HTTP request headers to send.
 * @returns The response body.
 * @throws If the request failed, or a bad HTTP status code was returned.
 */
export function patch(url, data, headers = {}) {
  if (data instanceof FormData) {
    Object.assign(headers, data.getHeaders());
  }
  return request({ method: 'patch', url, data, headers });
}
