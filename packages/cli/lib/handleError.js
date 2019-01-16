import { EOL } from 'os';

import logging from 'winston';

import AppsembleError from './AppsembleError';

/**
 * Handle a fatal error.
 *
 * HTTP errors are formatted nicely. For other errors, the stack trace is logged.
 *
 * @param {string} message Unused.
 * @param {Error} error The error that was thrown.
 */
export default function handleError(message, error = message) {
  if (typeof error === 'string') {
    logging.error(error);
    process.exit(1);
    return;
  }
  logging.error(error.message);
  if (error instanceof AppsembleError) {
    return;
  }
  const trace = error.stack.split(EOL).slice(1);
  const lines = error.response
    ? trace.concat(
        [
          `${error.request.method} ${error.request.path}`,
          `${error.response.status} ${error.response.statusText}`,
          '',
          error.response.data,
        ].map(line => `< ${line}`),
      )
    : trace;
  // eslint-disable-next-line no-console
  console.error(lines.join(EOL));
  process.exit(1);
}
