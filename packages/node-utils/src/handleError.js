import AppsembleError from './AppsembleError';
import { logger } from './logger';

/**
 * Handle a fatal error.
 *
 * HTTP errors are formatted nicely. For other errors, the stack trace is logged.
 *
 * @param {string} message Unused.
 * @param {Error} error The error that was thrown.
 */
export default function handleError(message, error, yargs) {
  if (typeof message === 'string') {
    yargs.showHelp();
    // eslint-disable-next-line no-console
    console.error(message);
  } else if (error instanceof AppsembleError) {
    logger.error(error.message);
  } else {
    logger.error(error);
  }
  process.exit(1);
}
