import { logger } from './logger';
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
  if (error instanceof AppsembleError) {
    logger.error(error.message);
    return;
  }
  logger.error(error);
  process.exit(1);
}
