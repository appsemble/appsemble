import axios from 'axios';
import FormData from 'form-data';
import logging from 'winston';

/**
 * Make an HTTP request using Axios.
 *
 * @param {Request} req The Axios request.
 */
export default async function request(req) {
  logging.info(`Start ${req.method.toUpperCase()} ${req.url}`);
  logging.silly('Request body:', req.body);
  const { data } = await axios(req);
  logging.info(`Success ${req.method.toUpperCase()} ${req.url}`);
  logging.debug('Response body:', data);
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
