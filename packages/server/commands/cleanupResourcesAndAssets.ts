import {
  deleteS3Files,
  getS3File,
  getS3FileStats,
  initS3Client,
  logger,
  uploadS3File,
} from '@appsemble/node-utils';
import { Op } from 'sequelize';
import { type Argv } from 'yargs';

import { databaseBuilder } from './builder/database.js';
import { App, getAppDB, initDB } from '../models/index.js';
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

  try {
    initS3Client({
      endPoint: argv.s3Host,
      port: argv.s3Port,
      useSSL: argv.s3Secure,
      accessKey: argv.s3AccessKey,
      secretKey: argv.s3SecretKey,
    });
  } catch (error: unknown) {
    logger.warn(`S3Error: ${error}`);
    logger.warn('Features related to file uploads will not work correctly!');
  }

  const date = new Date();

  const demoApps = await App.findAll({ attributes: ['id'], where: { demoMode: true } });
  await Promise.all(
    demoApps.map(async (demoApp) => {
      const { Asset, Resource, sequelize } = await getAppDB(demoApp.id);

      logger.info(`Cleaning up ephemeral assets from demo app ${demoApp.id}.`);

      const demoAssetsToDestroy = await Asset.findAll({
        attributes: ['id', 'name'],
        where: { ephemeral: true },
      });

      try {
        await deleteS3Files(
          `app-${demoApp.id}`,
          demoAssetsToDestroy.map((a) => a.id),
        );
      } catch (error) {
        logger.error(error);
      }

      const demoAssetsDeletionResult = await Asset.destroy({
        where: {
          id: { [Op.in]: demoAssetsToDestroy.map((asset) => asset.id) },
        },
      });

      logger.info(`Removed ${demoAssetsDeletionResult} ephemeral assets.`);

      const demoAssetsToReseed = await Asset.findAll({
        attributes: ['id', 'mime', 'filename', 'data', 'name', 'ResourceId'],
        where: { OriginalId: null, seed: true },
      });

      logger.info(`Reseeding ephemeral assets into demo app ${demoApp.id}.`);

      for (const asset of demoAssetsToReseed) {
        const { id, ...values } = asset.dataValues;
        const appId = asset.App!.id;
        const created = await Asset.create({
          ...values,
          ephemeral: true,
          seed: false,
        });
        const stream = await getS3File(`app-${appId}`, id);
        const stats = await getS3FileStats(`app-${appId}`, id);
        await uploadS3File(`app-${appId}`, created.id, stream, stats.size);
      }

      logger.info(
        `Reseeded ${demoAssetsToReseed.length} ephemeral assets into demo app ${demoApp.id}.`,
      );

      const demoResourcesToDestroy = await Resource.findAll({
        attributes: ['id'],
        where: {
          [Op.or]: [{ seed: false, expires: { [Op.lt]: date } }, { ephemeral: true }],
        },
      });

      logger.info(
        `Cleaning up ephemeral resources and resources with an expiry date earlier than ${date.toISOString()} from demo app ${demoApp.id}.`,
      );

      const demoResourcesDeletionResult = await Resource.destroy({
        where: {
          id: { [Op.in]: demoResourcesToDestroy.map((resource) => resource.id) },
        },
      });

      logger.info(`Removed ${demoResourcesDeletionResult} ephemeral resources.`);

      const demoResourcesToReseed = await Resource.findAll({
        attributes: ['type', 'data', 'AuthorId'],
        where: { seed: true },
      });

      logger.info(`Reseeding ephemeral resources into demo app ${demoApp.id}.`);

      await reseedResourcesRecursively(demoApp.definition, Resource, demoResourcesToReseed);

      logger.info(
        `Reseeded ${demoResourcesToReseed.length} ephemeral resources into demo app ${demoApp.id}.`,
      );
      await sequelize.close();
    }),
  );

  const apps = await App.findAll({ attributes: ['id'], where: { demoMode: false } });
  await Promise.all(
    apps.map(async (app) => {
      const { Asset, Resource, sequelize } = await getAppDB(app.id);
      const assetsToDestroy = await Asset.findAll({
        attributes: ['id', 'name'],
        where: { ephemeral: true },
      });

      logger.info(`Cleaning up ephemeral assets from regular app ${app.id}.`);

      try {
        await deleteS3Files(
          `app-${app.id}`,
          assetsToDestroy.map((a) => a.id),
        );
      } catch (error) {
        logger.error(error);
      }

      const assetsDeletionResult = await Asset.destroy({
        where: {
          id: { [Op.in]: assetsToDestroy.map((asset) => asset.id) },
        },
      });

      logger.info(`Removed ${assetsDeletionResult} assets.`);

      const resourcesToDestroy = await Resource.findAll({
        attributes: ['id'],
        where: {
          [Op.or]: [{ expires: { [Op.lt]: date } }, { ephemeral: true }],
        },
      });

      logger.info(
        `Cleaning up ephemeral resources and resources with an expiry date earlier than ${date.toISOString()} from regular app ${app.id}.`,
      );

      const resourcesDeletionResult = await Resource.destroy({
        where: {
          id: { [Op.in]: resourcesToDestroy.map((resource) => resource.id) },
        },
      });

      logger.info(`Removed ${resourcesDeletionResult} resources.`);
      await sequelize.close();
    }),
  );

  await db.close();
  process.exit();
}
