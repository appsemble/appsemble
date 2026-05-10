import { initS3Client, logger, uploadS3File } from '@appsemble/node-utils';
import { Op } from 'sequelize';
import { type Argv } from 'yargs';

import { databaseBuilder } from './builder/database.js';
import { BlockAsset, BlockVersion, initDB } from '../models/index.js';
import { argv } from '../utils/argv.js';
import {
  ensureBlockAssetsBucketPublicRead,
  getBlockAssetContentHash,
  getBlockAssetsBucketName,
  getBlockAssetStorageKey,
} from '../utils/blockAssets.js';
import { handleDBError } from '../utils/sqlUtils.js';

interface AdditionalArguments {
  batch?: number;
  dryRun?: boolean;
}

export interface MigrateBlockAssetsToS3Result {
  failed: number;
  scanned: number;
  skipped: number;
  uploaded: number;
  wouldUpload: number;
}

export const command = 'migrate-block-assets-to-s3';
export const description = 'Migrate existing block asset database BLOBs to S3 object storage.';

export function builder(yargs: Argv): Argv {
  return databaseBuilder(yargs)
    .option('batch', {
      desc: 'The batch size of block assets to migrate at once.',
      type: 'number',
      default: 100,
    })
    .option('dry-run', {
      desc: 'Count block assets that would be migrated without uploading objects or updating rows.',
      type: 'boolean',
      default: false,
    });
}

export async function migrateBlockAssetsToS3({
  batch = 100,
  dryRun = false,
}: AdditionalArguments = {}): Promise<MigrateBlockAssetsToS3Result> {
  const result: MigrateBlockAssetsToS3Result = {
    failed: 0,
    scanned: 0,
    skipped: 0,
    uploaded: 0,
    wouldUpload: 0,
  };
  let lastId = 0;

  if (!dryRun) {
    await ensureBlockAssetsBucketPublicRead();
  }

  for (;;) {
    const blockAssets = await BlockAsset.findAll({
      attributes: ['id', 'content', 'filename', 'mime', 'size', 'storageKey'],
      include: [
        {
          attributes: ['OrganizationId', 'name', 'version'],
          model: BlockVersion,
        },
      ],
      limit: batch,
      order: [['id', 'ASC']],
      where: {
        content: { [Op.not]: null },
        id: { [Op.gt]: lastId },
      },
    });

    if (!blockAssets.length) {
      break;
    }

    for (const blockAsset of blockAssets) {
      lastId = blockAsset.id;
      result.scanned += 1;

      const { BlockVersion: blockVersion, content, filename, mime } = blockAsset;
      if (!content || !blockVersion) {
        result.skipped += 1;
        logger.warn(`Skipped block asset ${blockAsset.id} because required metadata is missing.`);
        continue;
      }

      const contentHash = getBlockAssetContentHash(content);
      const storageKey = getBlockAssetStorageKey({
        blockName: blockVersion.name,
        contentHash,
        filename,
        organizationId: blockVersion.OrganizationId,
        version: blockVersion.version,
      });

      if (dryRun) {
        result.wouldUpload += 1;
        continue;
      }

      try {
        await uploadS3File(getBlockAssetsBucketName(), storageKey, content, content.byteLength, {
          'Cache-Control': 'public,max-age=31536000,immutable',
          'Content-Type': mime ?? 'application/octet-stream',
        });
        await blockAsset.update({
          content: null,
          size: content.byteLength,
          storageKey,
        });
        result.uploaded += 1;
      } catch (error) {
        result.failed += 1;
        logger.error(`Failed to migrate block asset ${blockAsset.id} to S3.`);
        logger.error(error);
      }
    }
  }

  logger.info(`Scanned ${result.scanned} block asset(s).`);
  logger.info(`Uploaded ${result.uploaded} block asset(s) to S3.`);
  logger.info(`Dry run would upload ${result.wouldUpload} block asset(s).`);
  logger.info(`Skipped ${result.skipped} block asset(s).`);
  logger.info(`Failed to migrate ${result.failed} block asset(s).`);

  return result;
}

export async function handler(options: AdditionalArguments = {}): Promise<void> {
  let db;

  try {
    db = initDB({
      database: argv.databaseName,
      host: argv.databaseHost,
      password: argv.databasePassword,
      port: argv.databasePort,
      ssl: argv.databaseSsl,
      uri: argv.databaseUrl,
      username: argv.databaseUser,
    });
  } catch (error: unknown) {
    handleDBError(error as Error);
  }

  try {
    initS3Client({
      accessKey: argv.s3AccessKey,
      endPoint: argv.s3Host,
      port: argv.s3Port,
      secretKey: argv.s3SecretKey,
      useSSL: argv.s3Secure,
    });
  } catch (error: unknown) {
    logger.warn(`S3Error: ${error}`);
    logger.warn('Block asset migration will not work correctly without S3 access.');
  }

  await migrateBlockAssetsToS3(options);
  await db.close();
  process.exit();
}
