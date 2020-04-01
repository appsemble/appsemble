import { logger } from '@appsemble/node-utils';
import highlight from 'cli-highlight';

/**
 * Log an SQL statement using syntax highlighting.
 *
 * @param statement The SQL statement to log.
 */
export default function logSQL(statement: string): void {
  logger.silly(highlight(statement, { language: 'sql', ignoreIllegals: true }));
}
