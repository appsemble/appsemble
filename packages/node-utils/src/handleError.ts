import { Argv } from 'yargs';

import { AppsembleError } from './AppsembleError';
import { logger } from './logger';

/**
 * Handle a fatal error.
 *
 * HTTP errors are formatted nicely. For other errors, the stack trace is logged.
 *
 * @param message - Unused.
 * @param error - The error that was thrown.
 * @param yargs - The active yargs instance.
 */
export function handleError(message: string, error: Error, yargs: Argv): void {
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
