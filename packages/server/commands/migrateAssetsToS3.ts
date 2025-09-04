import { logger, uploadS3File } from '@appsemble/node-utils';
import { Op } from 'sequelize';
import { type Argv } from 'yargs';

import { databaseBuilder } from './builder/database.js';
import { App, Asset, initDB } from '../models/index.js';
import { argv } from '../utils/argv.js';
import { iterTable } from '../utils/database.js';
import { handleDBError } from '../utils/sqlUtils.js';

export const command = 'migrate-assets-to-s3';
export const description = 'Migrates all assets with a leftover data column to S3';

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

  const assetsWithDataIter = iterTable(Asset, {
    attributes: ['id', 'data'],
    where: {
      data: { [Op.not]: null as any },
    },
    include: {
      model: App,
      attributes: ['id'],
    },
    chunkSize: 50,
  });

  let [uploadedCount, failedCount] = [0, 0];
  const failedAssetIds = [];
  for await (const asset of assetsWithDataIter) {
    logger.info(`Uploading asset ${asset.id} to S3 bucket app-${asset.App!.id}`);
    try {
      await uploadS3File(`app-${asset.App!.id}`, asset.id, asset.data!);
      uploadedCount += 1;
    } catch (error) {
      logger.error(`Failed to upload asset ${asset.id} to S3: ${error}`);
      failedCount += 1;
      failedAssetIds.push(asset.id);
    }
  }

  logger.info(`Uploaded ${uploadedCount} assets to S3.`);
  if (failedCount > 0) {
    logger.error(`Failed to upload ${failedCount} assets to S3.`);
    logger.error(`Failed asset IDs: ${failedAssetIds.join(', ')}`);
  }

  logger.info('Migrating complete. Check your database manually for leftovers just in case.');

  await db.close();
  process.exit();
}
