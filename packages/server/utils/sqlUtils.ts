import { AppsembleError, logger } from '@appsemble/node-utils';
import { highlight } from 'cli-highlight';
import {
  AccessDeniedError,
  ConnectionError,
  ConnectionRefusedError,
  HostNotFoundError,
} from 'sequelize';

/**
 * Log an SQL statement using syntax highlighting.
 *
 * @param statement The SQL statement to log.
 */
export function logSQL(statement: string): void {
  logger.silly(highlight(statement, { language: 'sql', ignoreIllegals: true }));
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
