import { logger } from '@appsemble/node-utils';
import { type Argv } from 'yargs';

import { initDB } from '../models/index.js';
import { argv } from '../utils/argv.js';
import { handleDBError } from '../utils/sqlUtils.js';
import { syncTrainings } from '../utils/syncTrainings.js';
import { databaseBuilder } from './builder/database.js';

export const command = 'synchronize-trainings';
export const description =
  'Checks the training folder for training documents and makes sure they are synchronized with the database';

export function builder(yargs: Argv): Argv {
  return databaseBuilder(yargs);
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
    await syncTrainings('trainings');
  } catch (error: unknown) {
    logger.warn('Trainings failed to sync');
    logger.warn(error);
  }

  await db.close();
  process.exit();
}
