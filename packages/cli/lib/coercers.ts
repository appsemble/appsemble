import { createReadStream, type ReadStream } from 'node:fs';

import normalizePath from 'normalize-path';

/**
 * Convert a remote to a valid URL.
 *
 * Ip addresses and localhost use the http://` protocol by default. Others use the `https://`
 * protocol by default. The path, search parameters, and hash are stripped.
 *
 * @param value The raw remote as specified by the CLI user.
 * @returns The normalized URL.
 */
export function coerceRemote(value: string): string {
  let url = value;
  if (!/^https?:\/\//.test(url)) {
    if (/^(\d+\.?){4}(\/|$|:)/.test(url)) {
      // It’s an IP address.
      url = `http://${url}`;
    } else if (/(\.|^)localhost(\/|$|:)/.test(url)) {
      // It’s a localhost address.
      url = `http://${url}`;
    } else {
      // It's a live remote.
      url = `https://${url}`;
    }
  }
  const remote = new URL(url);
  remote.hash = '';
  remote.search = '';
  remote.pathname = '';
  return String(remote);
}

/**
 * Get a stream based on the filepath.
 *
 * @param value The filepath of the file to read.
 * @returns A stream of the file.
 */
export function coerceFile(value: string): NodeJS.ReadStream | ReadStream {
  if (value == null) {
    // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
    return;
  }

  // Prevent trying to read the file multiple times.
  // https://github.com/yargs/yargs/issues/1802
  if (typeof value === 'object') {
    return value;
  }

  if (value === '-') {
    return process.stdin;
  }

  return createReadStream(normalizePath(value));
}
