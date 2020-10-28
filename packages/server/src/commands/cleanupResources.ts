import { logger } from '@appsemble/node-utils';
import { Op } from 'sequelize';
import { Argv } from 'yargs';

import { initDB, Resource } from '../models';
import { Argv as Args } from '../types';
import { handleDBError } from '../utils/sqlUtils';
import { databaseBuilder } from './builder/database';

export const command = 'cleanup-resources';
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
  logger.info(`Cleaning up all resources with an expiry date later than ${date.toISOString()}`);
  const result = await Resource.destroy({
    where: { expires: { [Op.lt]: date } },
  });
  logger.info(`Removed ${result} resources.`);

  await db.close();
}
