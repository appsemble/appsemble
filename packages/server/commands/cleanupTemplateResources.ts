import { logger } from '@appsemble/node-utils';
import { type Argv } from 'yargs';

import { databaseBuilder } from './builder/database.js';
import { App, initDB, Resource } from '../models/index.js';
import { argv } from '../utils/argv.js';
import { handleDBError } from '../utils/sqlUtils.js';

export const command = 'cleanup-template-resources';
export const description =
  'Deletes all non-clonable resources belonging to template apps from the database.';

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

  logger.info('Cleaning up all non-clonable resources belonging to template apps');

  const resourcesToDestroy = await Resource.findAll({
    attributes: ['id'],
    include: [
      {
        model: App,
        attributes: [],
        where: {
          template: true,
        },
        required: true,
      },
    ],
    where: {
      clonable: false,
    },
  });

  const destroyed = await Resource.destroy({
    where: {
      id: resourcesToDestroy.map((resource) => resource.id),
    },
  });
  logger.info(`Removed ${destroyed} resources.`);

  await db.close();
}
