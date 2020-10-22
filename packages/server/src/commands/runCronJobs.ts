import { logger } from '@appsemble/node-utils';
import { parseExpression } from 'cron-parser';
import { Op } from 'sequelize';
import type { Argv } from 'yargs';

import { App, initDB } from '../models';
import type { Argv as Args } from '../types';
import { handleDBError } from '../utils/sqlUtils';
import { databaseBuilder } from './builder/database';

export const command = 'run-cron-job';
export const description = 'Deletes all expired resources from the database.';

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

  apps.forEach((app) => {
    logger.info(`Processing cron jobs for app ${app.id}`);
    for (const [id, job] of Object.entries(app.definition.cron)) {
      const schedule = parseExpression(job.schedule, { startDate });

      if (!schedule.hasPrev()) {
        logger.info(`Skipping ${id}. Next scheduled run: ${schedule.next().toISOString()}`);
        continue;
      }

      logger.info(`Running cronjob ${id}. Last schedule: ${schedule.prev().toISOString()}`);
    }
  });

  await db.close();
}
