import { logger } from '@appsemble/node-utils';
import { remap, RemapperContext } from '@appsemble/utils';
import { parseExpression } from 'cron-parser';
import { Op } from 'sequelize';
import { Argv } from 'yargs';

import { App, initDB } from '../models';
import { Argv as Args } from '../types';
import { actions, ServerActionParameters } from '../utils/actions';
import { iterTable } from '../utils/database';
import { Mailer } from '../utils/email/Mailer';
import { handleDBError } from '../utils/sqlUtils';
import { databaseBuilder } from './builder/database';

export const command = 'run-cronjobs';
export const description = 'Runs all cronjobs associated with apps.';

async function handleAction(
  action: (params: ServerActionParameters) => Promise<unknown>,
  params: ServerActionParameters,
): Promise<void> {
  logger.info(`Running action: ${params.action.type}`);
  let data =
    'remap' in params.action
      ? remap(params.action.remap, params.data, { appId: params.app.id } as RemapperContext)
      : params.data;

  try {
    data = await action({ ...params, data });
    if (params.action.onSuccess) {
      await handleAction(actions[params.action.onSuccess.type], {
        ...params,
        action: params.action.onSuccess,
        data,
      });
    }
  } catch (error: unknown) {
    logger.error(`Error running action: ${params.action.type}`);
    if (params.action.onError) {
      return handleAction(actions[params.action.onError.type], {
        ...params,
        action: params.action.onError,
        data,
      });
    }
    throw error;
  }
  logger.info(`Succesfully ran action: ${params.action.type}`);
}

export function builder(yargs: Argv): Argv {
  return databaseBuilder(yargs)
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

export async function handler(argv: Args): Promise<void> {
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

  // 1 hour ago
  const startDate = Date.now() - 60 * 60 * 1e3;

  for await (const app of iterTable(App, {
    attributes: ['definition', 'id'],
    where: { definition: { cron: { [Op.not]: null } } },
  })) {
    let lastId;

    try {
      logger.info(
        `Processing ${Object.keys(app.definition.cron).length} cron jobs for app ${app.id}`,
      );

      for (const [id, job] of Object.entries(app.definition.cron)) {
        lastId = id;
        const schedule = parseExpression(job.schedule, { startDate });

        if (!schedule.hasPrev()) {
          logger.info(`Skipping ${id}. Next scheduled run: ${schedule.next().toISOString()}`);
          continue;
        }

        logger.info(`Running cronjob ${id}. Last schedule: ${schedule.prev().toISOString()}`);
        const action = actions[job.action.type];
        await handleAction(action, { app, user: null, action: job.action, mailer, data: null });
      }
    } catch (error: unknown) {
      logger.error(`Failed to run ${lastId} for app ${app.id}`);
      logger.error(error);
    }
  }

  await db.close();
}
