import { initS3Client, logger, uploadS3File } from '@appsemble/node-utils';
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
  return databaseBuilder(yargs).option('dry-run', {
    type: 'boolean',
    default: true,
    description:
      'Prevents the command from performing the migration and instead logs the actions that would be taken.',
  });
}

function dryUploadS3File(bucket: string, key: string, data: Buffer): Promise<void> {
  logger.info(
    `[DryRun] Uploading file to S3 bucket ${bucket} with key ${key} and size ${data.length}`,
  );
  return Promise.resolve();
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
      accessKey: argv.s3AccessKey,
      endPoint: argv.s3Host,
      secretKey: argv.s3SecretKey,
      port: argv.s3Port,
      useSSL: argv.s3Secure,
    });
  } catch (error: unknown) {
    logger.warn('S3Error: Failed to initialize S3 client.');
    logger.error(error as Error);
    process.exit(1);
  }

  const assetsWithDataIter = iterTable(Asset, {
    attributes: ['id', 'data'],
    where: {
      data: { [Op.not]: null as any },
    },
    include: {
      model: App,
      attributes: ['id'],
      required: true,
    },
    chunkSize: 50,
  });

  let [uploadedCount, failedCount] = [0, 0];
  const failedAssetIds = [];

  if (argv.dryRun) {
    logger.info('Dry run enabled. NO changes will be made to S3.');
  } else {
    logger.info('Dry run disabled. Changes WILL be made to S3.');
  }

  for await (const asset of assetsWithDataIter) {
    logger.info(`Uploading asset ${asset.id} to S3 bucket app-${asset.App!.id}`);
    try {
      await (argv.dryRun
        ? dryUploadS3File(`app-${asset.App!.id}`, asset.id, asset.data!)
        : uploadS3File(`app-${asset.App!.id}`, asset.id, asset.data!));
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
