import { logger } from '@appsemble/node-utils';
import { Op, type Sequelize } from 'sequelize';
import { type Argv } from 'yargs';

import { databaseBuilder } from './builder/database.js';
import { App, getAppDB, initDB, Organization, transactional, User } from '../models/index.js';
import { argv } from '../utils/argv.js';
import { handleDBError } from '../utils/sqlUtils.js';

export const command = 'cleanup-soft-deleted-records';
export const description =
  'Permanently deleted soft deleted records that are older than three months';

export function builder(yargs: Argv): Argv {
  return databaseBuilder(yargs);
}

export async function cleanupSoftDeletedRecords(): Promise<void> {
  // Delete records that have been deleted at least 90 days ago.
  const deletedAt = Date.now() - 90 * 24 * 60 * 60 * 1000;
  const deletedAtParsed = new Date(deletedAt).toLocaleString();

  const deleteQuery = {
    where: {
      deleted: {
        [Op.lt]: deletedAt,
      },
    },
    force: true,
  };

  const apps = await App.findAll({ attributes: ['id'] });
  for (const app of apps) {
    let appDB;
    try {
      appDB = await getAppDB(app.id);
    } catch (error) {
      logger.warn(`Failed to connect to database for app ${app.id}, skipping cleanup.`);
      logger.error(error);
      continue;
    }

    const { Asset, Resource, sequelize } = appDB;
    try {
      await sequelize.transaction(async (appTransaction) => {
        logger.info(`Deleting resources soft deleted before ${deletedAtParsed} for app ${app.id}`);
        const deletedResources = await Resource.destroy({
          ...deleteQuery,
          transaction: appTransaction,
        });
        logger.info(`Successfully deleted ${deletedResources} resources from app ${app.id}.`);

        logger.info(`Deleting assets soft deleted before ${deletedAtParsed} for app ${app.id}`);
        const deletedAssets = await Asset.destroy({
          ...deleteQuery,
          transaction: appTransaction,
        });
        logger.info(`Successfully deleted ${deletedAssets} assets from app ${app.id}.`);
      });
    } catch (error) {
      logger.error(`Failed to cleanup soft deleted records for app ${app.id}.`);
      logger.error(error);
    } finally {
      await sequelize.close();
    }
  }

  try {
    await transactional(async (transaction) => {
      try {
        logger.info(`Deleting apps soft deleted before ${deletedAtParsed}`);
        const deletedApps = await App.destroy({ ...deleteQuery, transaction });
        logger.info(`Successfully deleted ${deletedApps} apps.`);
      } catch (error) {
        logger.error(`Failed to cleanup soft deleted apps.`);
        logger.error(error);
        throw error;
      }

      try {
        logger.info(`Deleting organizations soft deleted before ${deletedAtParsed}`);
        const deletedOrganizations = await Organization.destroy({ ...deleteQuery, transaction });
        logger.info(`Successfully deleted ${deletedOrganizations} organizations.`);
      } catch (error) {
        logger.error(`Failed to cleanup soft deleted organizations.`);
        logger.error(error);
        throw error;
      }

      try {
        logger.info(`Deleting users soft deleted before ${deletedAtParsed}`);
        const deletedUsers = await User.destroy({ ...deleteQuery, transaction });
        logger.info(`Successfully deleted ${deletedUsers} users.`);
      } catch (error) {
        logger.error(`Failed to cleanup soft deleted users.`);
        logger.error(error);
        throw error;
      }
    });
  } catch (error) {
    logger.error('Failed to cleanup soft deleted records in the main database.');
    logger.error(error);
    throw error;
  }
}

export async function handler(): Promise<void> {
  let db: Sequelize | undefined;

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
    await cleanupSoftDeletedRecords();
  } catch {
    await db?.close();
    process.exit(1);
  }
  await db?.close();
  process.exit();
}
