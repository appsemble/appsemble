import highlight from 'cli-highlight';

/**
 * Log an SQL statement using syntax highlighting.
 *
 * @param {string} statement The SQL statement to log.
 */
export default function logSQL(statement) {
  // eslint-disable-next-line no-console
  console.log(highlight(statement, { language: 'sql', ignoreIllegals: true }));
}
