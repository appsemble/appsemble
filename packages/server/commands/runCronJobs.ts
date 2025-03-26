import { logger } from '@appsemble/node-utils';
import cron from 'cron-parser';
import { Op } from 'sequelize';
import { type Argv } from 'yargs';

import { databaseBuilder } from './builder/database.js';
import { App, initDB } from '../models/index.js';
import { options } from '../options/options.js';
import { handleAction } from '../utils/action.js';
import { actions } from '../utils/actions/index.js';
import { argv } from '../utils/argv.js';
import { iterTable } from '../utils/database.js';
import { Mailer } from '../utils/email/Mailer.js';
import { handleDBError } from '../utils/sqlUtils.js';

export const command = 'run-cronjobs';
export const description = 'Runs all cronjobs associated with apps.';

export function builder(yargs: Argv): Argv {
  return databaseBuilder(yargs)
    .option('interval', {
      desc: 'How many minutes are between each cron job run.',
      type: 'number',
      default: 5,
    })
    .option('sentry-dsn', {
      desc: 'The Sentry DSN to use for error reporting. See https://sentry.io for details.',
    })
    .option('sentry-environment', {
      desc: 'The Sentry environment to use for error reporting. See https://sentry.io for details.',
    })
    .option('smtp-host', {
      desc: 'The host of the SMTP server to connect to.',
    })
    .option('smtp-port', {
      desc: 'The port of the SMTP server to connect to.',
      type: 'number',
    })
    .option('smtp-secure', {
      desc: 'Use TLS when connecting to the SMTP server.',
      type: 'boolean',
      default: false,
    })
    .option('smtp-user', {
      desc: 'The user to use to login to the SMTP server.',
      implies: ['smtp-pass', 'smtp-from'],
    })
    .option('smtp-pass', {
      desc: 'The password to use to login to the SMTP server.',
      implies: ['smtp-user', 'smtp-from'],
    })
    .option('smtp-from', {
      desc: 'The address to use when sending emails.',
      implies: ['smtp-user', 'smtp-pass'],
    });
}

export async function handler(): Promise<void> {
  let db;

  try {
    db = initDB({
      host: argv.databaseHost,
      port: argv.databasePort,
      username: argv.databaseUser,
      password: argv.databasePassword,
      database: argv.databaseName,
      ssl: argv.databaseSsl,
      uri: argv.databaseUrl,
    });
  } catch (error: unknown) {
    handleDBError(error as Error);
  }

  const mailer = new Mailer(argv);

  // The time of argv.interval minutes ago
  const startDate = Date.now() - argv.interval * 60 * 1e3;

  for await (const app of iterTable(App, {
    attributes: [
      'definition',
      'id',
      'OrganizationId',
      'path',
      'emailHost',
      'emailUser',
      'emailPassword',
      'emailPort',
      'emailSecure',
    ],
    where: { definition: { cron: { [Op.not]: null } } },
  })) {
    let lastId;

    try {
      logger.info(
        `Processing ${Object.keys(app.definition.cron ?? {}).length} cron jobs for app ${app.id}`,
      );

      for (const [id, job] of Object.entries(app.definition.cron ?? {})) {
        lastId = id;
        const schedule = cron.parseExpression(job.schedule, { startDate });

        if (!schedule.hasPrev()) {
          logger.info(`Skipping ${id}. Next scheduled run: ${schedule.next().toISOString()}`);
          continue;
        }

        logger.info(`Running cronjob ${id}. Last schedule: ${schedule.prev().toISOString()}`);
        const action = actions[job.action.type] as (typeof actions)[keyof typeof actions];
        // @ts-expect-error 2345 argument of type is not assignable to parameter of type
        // (strictNullChecks)
        await handleAction(action, {
          app,
          action: job.action,
          mailer,
          data: null,
          options,
          context: {} as any,
        });
      }
    } catch (error: unknown) {
      logger.error(`Failed to run ${lastId} for app ${app.id}`);
      logger.error(error);
    }
  }

  await db.close();
  process.exit();
}
