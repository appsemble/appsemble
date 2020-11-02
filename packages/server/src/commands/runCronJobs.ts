import { logger } from '@appsemble/node-utils';
import { remap } from '@appsemble/utils/src';
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
  let data = remap(params.action.remap, params.data, null);

  try {
    data = await action({ ...params, data });
    if (params.action.onSuccess) {
      await handleAction(actions[params.action.onSuccess.type], { ...params, data });
    }
  } catch {
    if (params.action.onError) {
      await handleAction(actions[params.action.onError.type], { ...params, data });
    }
  }
}

export function builder(yargs: Argv): Argv {
  return databaseBuilder(yargs);
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

  // 1 hour ago
  const startDate = Date.now() - 60 * 60 * 1e3;

  const apps = await App.findAll({ where: { definition: { cron: { [Op.not]: null } } } });
  logger.info(`Found ${apps.length} apps with cron jobs.`);

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
        const data = remap(job.action.remap, null, null);
        const mailer = new Mailer(argv);

        await handleAction(action, { app, user: null, action: job.action, mailer, data });
      }
    } catch (error: unknown) {
      logger.error(`Failed to run ${lastId} for app ${app.id}`);
      logger.error(error);
    }
  }

  await db.close();
}
