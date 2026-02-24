import { AppsembleError, getRequestId, logger } from '@appsemble/node-utils';
import { highlight } from 'cli-highlight';
import {
  AccessDeniedError,
  ConnectionError,
  ConnectionRefusedError,
  HostNotFoundError,
} from 'sequelize';

import { argv } from './argv.js';

/**
 * Log an SQL statement using syntax highlighting.
 *
 * When benchmark mode is enabled and timing is provided, queries exceeding the slow query threshold
 * are logged at warn level.
 *
 * @param statement The SQL statement to log.
 * @param timing The query execution time in milliseconds (only provided when benchmark is enabled).
 */
export function logSQL(statement: string, timing?: number): void {
  const highlighted = highlight(statement, { language: 'sql', ignoreIllegals: true });
  const requestId = getRequestId();
  const prefix = requestId ? `[${requestId.slice(0, 8)}] ` : '';

  if (timing === undefined) {
    logger.silly(`${prefix}${highlighted}`);
  } else if (timing > argv.slowQueryThreshold) {
    logger.warn(`${prefix}Slow query (${timing}ms): ${highlighted}`);
  } else {
    logger.silly(`${prefix}(${timing}ms) ${highlighted}`);
  }
}

export function handleDBError(error: Error): never {
  logger.error(error);
  const original = (error as ConnectionError).original as any;
  if (error instanceof AccessDeniedError) {
    throw new AppsembleError(`AccessDeniedError: ${original.sqlMessage}`);
  }
  if (error instanceof HostNotFoundError) {
    throw new AppsembleError(
      `HostNotFoundError: Could not find host ´${original.hostname}:${original.port}´`,
    );
  }
  if (error instanceof ConnectionRefusedError) {
    throw new AppsembleError(
      `ConnectionRefusedError: Connection refused on address ´${original.address}:${original.port}´`,
    );
  }
  if (error instanceof ConnectionError) {
    throw new AppsembleError(`ConnectionError: ${original.sqlMessage}`);
  }
  throw error;
}
