import winston from 'winston';

const levels = ['crit', 'error', 'warn', 'info', 'verbose', 'silly'];
const DEFAULT_LEVEL = levels.findIndex(level => level === 'info');

/**
 * The default logger for NodeJS Appsemble projects.
 */
export const logger = winston.createLogger({
  level: levels[DEFAULT_LEVEL],
  levels: levels.reduce((acc, level, index) => ({ ...acc, [level]: index }), {}),
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.align(),
    winston.format.printf(({ timestamp, level, message }) => `${timestamp} [${level}]: ${message}`),
  ),
  transports: [new winston.transports.Console()],
});

/**
 * Set the logging level using a string or numeric value.
 *
 * @param {number|string} verbosity
 */
export function setLogLevel(level = DEFAULT_LEVEL) {
  logger.level = Number.isNaN(Number(level))
    ? level
    : levels[Math.min(Math.max(level, 0), levels.length - 1)];
  logger.silly(`Logging level set to ${logger.level}`);
}

/**
 * Configure logging using named quiet and verbose parameters.
 *
 * Use this in conjunction with `yargs`.
 *
 * @param {Object} argv
 * @param {number} argv.quiet The negative verbosity count.
 * @param {number} argv.verbose The verbosity count.
 */
export function configureLogger({ quiet = 0, verbose = 0 }) {
  setLogLevel(DEFAULT_LEVEL + verbose - quiet);
}
