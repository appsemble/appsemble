import { initS3Client, logger } from '@appsemble/node-utils';
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

  try {
    initS3Client({
      endPoint: argv.s3Host,
      port: argv.s3Port,
      useSSL: argv.s3Secure,
      accessKey: argv.s3AccessKey,
      secretKey: argv.s3SecretKey,
      region: argv.s3Region,
      pathStyle: argv.s3PathStyle,
      bucket: argv.s3Bucket,
    });
  } catch (error: unknown) {
    logger.warn(`S3Error: ${error}`);
    logger.warn('Features related to file uploads will not work correctly!');
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
      's3Bucket',
    ],
    where: { definition: { cron: { [Op.not]: null } } },
  })) {
    logger.info(
      `Processing ${Object.keys(app.definition.cron ?? {}).length} cron jobs for app ${app.id}`,
    );

    for (const [id, job] of Object.entries(app.definition.cron ?? {})) {
      try {
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
          context: { mailer } as any,
        });
      } catch (error: unknown) {
        logger.error(`Failed to run ${id} for app ${app.id}`);
        logger.error(error);
      }
    }
  }

  await db.close();
  process.exit();
}
