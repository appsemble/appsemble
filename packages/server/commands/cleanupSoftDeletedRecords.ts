import { logger } from '@appsemble/node-utils';
import { Op } from 'sequelize';
import { type Argv } from 'yargs';

import { databaseBuilder } from './builder/database.js';
import {
  App,
  Asset,
  initDB,
  Organization,
  Resource,
  transactional,
  User,
} from '../models/index.js';
import { argv } from '../utils/argv.js';
import { handleDBError } from '../utils/sqlUtils.js';

export const command = 'cleanup-soft-deleted';
export const description =
  'Permanently deleted soft deleted records that are older than three months';

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

  logger.info('Cleaning up all demo users');
  // Delete records that have been deleted at least 90 days ago.
  const deletedAt = Date.now() - 90 * 24 * 60 * 60 * 1000;
  await transactional(async (transaction) => {
    const deleteQuery = {
      where: {
        deleted: {
          [Op.lt]: deletedAt,
        },
      },
      force: true,
      transaction,
    };
    const deletedAtParsed = new Date(deletedAt).toLocaleString();
    logger.info(`Deleting apps soft deleted before ${deletedAtParsed}`);
    const deletedApps = await App.destroy(deleteQuery);
    logger.info(`Successfully deleted ${deletedApps} apps.`);

    logger.info(`Deleting organizations soft deleted before ${deletedAtParsed}`);
    const deletedOrganizations = await Organization.destroy(deleteQuery);
    logger.info(`Successfully deleted ${deletedOrganizations} organizations.`);

    logger.info(`Deleting resources soft deleted before ${deletedAtParsed}`);
    const deletedResources = await Resource.destroy(deleteQuery);
    logger.info(`Successfully deleted ${deletedResources} resources.`);

    logger.info(`Deleting assets soft deleted before ${deletedAtParsed}`);
    const deletedAssets = await Asset.destroy(deleteQuery);
    logger.info(`Successfully deleted ${deletedAssets} assets.`);

    logger.info(`Deleting users soft deleted before ${deletedAtParsed}`);
    const deletedUsers = await User.destroy(deleteQuery);
    logger.info(`Successfully deleted ${deletedUsers} users.`);
  });
  await db.close();
  process.exit();
}
