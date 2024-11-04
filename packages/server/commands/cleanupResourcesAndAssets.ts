import { logger } from '@appsemble/node-utils';
import { Op } from 'sequelize';
import { type Argv } from 'yargs';

import { databaseBuilder } from './builder/database.js';
import { App, Asset, initDB, Resource } from '../models/index.js';
import { argv } from '../utils/argv.js';
import { reseedResourcesRecursively } from '../utils/resource.js';
import { handleDBError } from '../utils/sqlUtils.js';

export const command = 'cleanup-resources-and-assets';
export const description =
  'Deletes all expired or ephemeral resources and assets from the database.';

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

  const demoAssetsToDestroy = await Asset.findAll({
    attributes: ['id'],
    include: [
      {
        model: App,
        attributes: ['id'],
        where: {
          demoMode: true,
        },
        required: true,
      },
    ],
    where: {
      ephemeral: true,
    },
  });

  logger.info('Cleaning up ephemeral assets from demo apps.');

  const demoAssetsDeletionResult = await Asset.destroy({
    where: {
      id: { [Op.in]: demoAssetsToDestroy.map((asset) => asset.id) },
    },
  });

  logger.info(`Removed ${demoAssetsDeletionResult} ephemeral assets.`);

  const demoAssetsToReseed = await Asset.findAll({
    attributes: ['mime', 'filename', 'data', 'name', 'AppId', 'ResourceId'],
    include: [
      {
        model: App,
        attributes: ['id'],
        where: {
          demoMode: true,
        },
        required: true,
      },
    ],
    where: {
      seed: true,
    },
  });

  logger.info('Reseeding ephemeral assets into demo apps.');

  for (const asset of demoAssetsToReseed) {
    await Asset.create({
      ...asset.dataValues,
      ephemeral: true,
      seed: false,
    });
  }

  logger.info(`Reseeded ${demoAssetsToReseed.length} ephemeral assets into demo apps.`);

  const date = new Date();
  const demoResourcesToDestroy = await Resource.findAll({
    attributes: ['id', 'AppId', 'type'],
    include: [
      {
        model: App,
        attributes: ['definition'],
        where: {
          demoMode: true,
        },
        required: true,
      },
    ],
    where: {
      [Op.or]: [{ seed: false, expires: { [Op.lt]: date } }, { ephemeral: true }],
    },
  });

  logger.info(
    `Cleaning up ephemeral resources and resources with an expiry date earlier than ${date.toISOString()} from demo apps.`,
  );

  const demoResourcesDeletionResult = await Resource.destroy({
    where: {
      id: { [Op.in]: demoResourcesToDestroy.map((resource) => resource.id) },
    },
  });

  logger.info(`Removed ${demoResourcesDeletionResult} ephemeral resources.`);

  const demoResourcesToReseed = await Resource.findAll({
    attributes: ['type', 'data', 'AppId', 'AuthorId'],
    include: [
      {
        model: App,
        attributes: ['id', 'definition'],
        where: {
          demoMode: true,
        },
        required: true,
      },
    ],
    where: {
      seed: true,
    },
  });

  logger.info('Reseeding ephemeral resources into demo apps.');

  const resourcesByApp: Record<string, Resource[]> = {};
  for (const resource of demoResourcesToReseed) {
    resourcesByApp[resource.App.id] = [...(resourcesByApp[resource.App.id] ?? []), resource];
  }

  for (const appResources of Object.values(resourcesByApp)) {
    await reseedResourcesRecursively(appResources[0].App.definition, appResources);
  }

  logger.info(`Reseeded ${demoResourcesToReseed.length} ephemeral resources into demo apps.`);

  const assetsToDestroy = await Asset.findAll({
    attributes: ['id'],
    include: [
      {
        model: App,
        attributes: ['id'],
        where: {
          demoMode: false,
        },
        required: true,
      },
    ],
    where: {
      ephemeral: true,
    },
  });

  logger.info('Cleaning up ephemeral assets from regular apps.');

  const assetsDeletionResult = await Asset.destroy({
    where: {
      id: { [Op.in]: assetsToDestroy.map((asset) => asset.id) },
    },
  });

  logger.info(`Removed ${assetsDeletionResult} assets.`);

  const resourcesToDestroy = await Resource.findAll({
    attributes: ['id', 'AppId', 'type'],
    include: [
      {
        model: App,
        attributes: ['definition'],
        where: {
          demoMode: false,
        },
        required: true,
      },
    ],
    where: {
      [Op.or]: [{ expires: { [Op.lt]: date } }, { ephemeral: true }],
    },
  });

  logger.info(
    `Cleaning up ephemeral resources and resources with an expiry date earlier than ${date.toISOString()} from regular apps.`,
  );

  const resourcesDeletionResult = await Resource.destroy({
    where: {
      id: { [Op.in]: resourcesToDestroy.map((resource) => resource.id) },
    },
  });

  logger.info(`Removed ${resourcesDeletionResult} resources.`);

  await db.close();
  process.exit();
}
