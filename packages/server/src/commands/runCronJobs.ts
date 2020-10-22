import { logger } from '@appsemble/node-utils';
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

  const date = new Date();
  const apps = await App.findAll({ where: { definition: { cron: !null } } });
  logger.info(`Found ${apps.length} apps with cron jobs.`);

  await db.close();
}
