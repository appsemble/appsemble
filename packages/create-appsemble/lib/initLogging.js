import stringify from 'json-stringify-safe';
import { isEmpty } from 'lodash';
import winston from 'winston';

const DEFAULT_LEVEL = winston.config.npm.levels.info;

/**
 * Configure logging.
 *
 * @param {Object} argv
 * @param {Number} argv.quiet The negative verbosity count
 * @param {Number} argv.verbose The verbosity count
 */
export default function initLogging({ quiet, verbose }) {
  const levels = Object.entries(winston.config.npm.levels)
    .sort(([, a], [, b]) => a - b)
    .map(([level]) => level);
  const verbosity = Math.min(Math.max(DEFAULT_LEVEL + verbose - quiet, 0), levels.length - 1);
  winston.level = levels[verbosity];
  winston.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'HH:mm:ss' }),
        winston.format.align(),
        winston.format.printf(
          ({ timestamp, level, message, ...args }) =>
            `${timestamp} [${level}]: ${message}${isEmpty(args) ? '' : ` ${stringify(args)}`}`,
        ),
      ),
    }),
  );
  winston.silly(`Logging level set to ${winston.level}`);
}
