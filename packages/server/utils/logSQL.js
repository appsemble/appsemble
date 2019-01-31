import { logger } from '@appsemble/node-utils';
import highlight from 'cli-highlight';

/**
 * Log an SQL statement using syntax highlighting.
 *
 * @param {string} statement The SQL statement to log.
 */
export default function logSQL(statement) {
  logger.silly(highlight(statement, { language: 'sql', ignoreIllegals: true }));
}
