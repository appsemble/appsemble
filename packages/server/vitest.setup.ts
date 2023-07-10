import { STATUS_CODES } from 'node:http';

import { setFixtureBase, setLogLevel } from '@appsemble/node-utils';
import { type AxiosResponse } from 'axios';
// https://vitest.dev/guide/snapshot.html#image-snapshots
// eslint-disable-next-line import/no-extraneous-dependencies
import { toMatchImageSnapshot } from 'jest-image-snapshot';
// eslint-disable-next-line import/no-extraneous-dependencies
import { expect } from 'vitest';

type Stringify = (value: unknown) => string;
type AxiosResponseTransformer = (response: AxiosResponse) => AxiosResponse;

setFixtureBase(import.meta);
setLogLevel(0);

expect.extend({ toMatchImageSnapshot });

let transformResponse: (response: AxiosResponse) => AxiosResponse;

/**
 * Set a function used to transform an axios response before serializing.
 *
 * The default transformer removes the `date` header.
 *
 * @param transformer A function to transform the axios response.
 */
export function setResponseTransformer(transformer: AxiosResponseTransformer): void {
  transformResponse = transformer;
}

/**
 * Serialize an HTTP status line for an axios response.
 *
 * @param response The axios response to serialize.
 * @returns The HTTP status line.
 */
function serializeStatusLine({ status, statusText }: AxiosResponse): string {
  const result = `HTTP/1.1 ${status}`;
  if (statusText) {
    return `${result} ${statusText}`;
  }
  if (status in STATUS_CODES) {
    return `${result} ${STATUS_CODES[status]}`;
  }
  return result;
}

/**
 * Serialize axios HTTP headers.
 *
 * @param headers The axios headers object so serialize.
 * @param toString A function used to convert arbritary values to string.
 * @returns The HTTP headers as a string.
 */
function serializeHeaders({ headers }: AxiosResponse, toString: Stringify): string {
  return Object.entries(headers)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(
      ([key, value]) =>
        `\n${key.replace(/((-|^)[a-z])/g, (m) => m.toUpperCase())}: ${
          typeof value === 'string' ? value : toString(value)
        }`,
    )
    .join('');
}

/**
 * Serialize the axios HTTP body.
 *
 * @param response The axios body data so serialize.
 * @param toString A function used to convert arbritary values to string.
 * @returns The HTTP body as a string.
 */
function serializeBody({ data, headers }: AxiosResponse, toString: Stringify): string {
  if (typeof data === 'string' && headers['content-type']?.split('/')[0] === 'text') {
    return data;
  }
  return toString(data);
}

/**
 * Serialize the Axios HTTP response.
 *
 * @param response The Axios response to serialize
 * @param toString XXX
 * @returns The Axios response serialized as a string.
 */
function serializeResponse(response: AxiosResponse, toString: Stringify): string {
  let result = serializeStatusLine(response);
  if (response.headers) {
    result += serializeHeaders(response, toString);
  }
  if (response.data !== '') {
    result += `\n\n${serializeBody(response, toString)}`;
  }
  return result;
}

setResponseTransformer(
  ({
    headers: {
      'accept-ranges': acceptRanges,
      'access-control-allow-origin': accessControlAllowOrigin,
      connection,
      'content-length': contentLength,
      date,
      'keep-alive': keepAlive,
      vary,
      ...headers
    },
    ...response
  }) => ({
    ...response,
    headers,
  }),
);

expect.addSnapshotSerializer({
  serialize(val, config, indentation, depth, refs, printer) {
    return serializeResponse(transformResponse(val), (obj) =>
      printer(obj, { ...config, escapeString: false }, indentation, depth, refs),
    );
  },
  test(actual) {
    return (
      typeof actual === 'object' &&
      actual != null &&
      'data' in actual &&
      typeof actual.config === 'object' &&
      typeof actual.headers === 'object' &&
      typeof actual.status === 'number' &&
      typeof actual.statusText === 'string'
    );
  },
});
