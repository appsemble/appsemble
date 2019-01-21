import { EOL } from 'os';

import { logger } from '@appsemble/node-utils';

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
    logger.error(error);
    process.exit(1);
    return;
  }
  if (error instanceof AppsembleError) {
    logger.error(error.message);
    return;
  }
  const trace = error.stack.split(EOL);
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
  logger.error(lines.join(EOL));
  process.exit(1);
}
