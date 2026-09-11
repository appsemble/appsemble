import {
  initS3Client,
  isValidBlockAssetFilename,
  logger,
  uploadS3File,
} from '@appsemble/node-utils';
import { Op } from 'sequelize';
import { type Argv } from 'yargs';

import { databaseBuilder } from './builder/database.js';
import { BlockAsset, BlockVersion, initDB } from '../models/index.js';
import { argv } from '../utils/argv.js';
import {
  ensureBlockAssetsBucketPublicRead,
  getBlockAssetsBucketName,
  getBlockAssetStorageKey,
} from '../utils/blockAssets.js';
import { handleDBError } from '../utils/sqlUtils.js';

interface AdditionalArguments {
  batch?: number;
}

export interface MigrateBlockAssetsToS3Result {
  failed: number;
  scanned: number;
  skipped: number;
  uploaded: number;
}

export const command = 'migrate-block-assets-to-s3';
export const description = 'Migrate existing block asset database BLOBs to S3 object storage.';

export function builder(yargs: Argv): Argv {
  return databaseBuilder(yargs).option('batch', {
    desc: 'The batch size of block assets to migrate at once.',
    type: 'number',
    default: 100,
  });
}

export async function migrateBlockAssetsToS3({
  batch = 100,
}: AdditionalArguments = {}): Promise<MigrateBlockAssetsToS3Result> {
  if (!Number.isInteger(batch) || batch < 1) {
    throw new RangeError('The block asset migration batch size must be a positive integer.');
  }

  const result: MigrateBlockAssetsToS3Result = {
    failed: 0,
    scanned: 0,
    skipped: 0,
    uploaded: 0,
  };
  let lastId = 0;

  await ensureBlockAssetsBucketPublicRead();

  for (;;) {
    const blockAssets = await BlockAsset.findAll({
      attributes: ['id', 'content', 'filename', 'mime', 'size', 'storageKey'],
      include: [
        {
          attributes: ['id', 'OrganizationId', 'name', 'version'],
          model: BlockVersion,
        },
      ],
      limit: batch,
      order: [['id', 'ASC']],
      where: {
        id: { [Op.gt]: lastId },
        storageKey: null,
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

      // Validate every filename before using it as an object key and preserve database content if
      // validation fails.
      if (!isValidBlockAssetFilename(filename)) {
        result.skipped += 1;
        logger.warn(
          `Skipped block asset ${blockAsset.id} because its filename is invalid: ${filename}`,
        );
        continue;
      }

      const storageKey = getBlockAssetStorageKey({
        blockName: blockVersion.name,
        blockVersionId: blockVersion.id,
        filename,
        organizationId: blockVersion.OrganizationId,
        version: blockVersion.version,
      });

      try {
        await uploadS3File(getBlockAssetsBucketName(), storageKey, content, content.byteLength, {
          'Cache-Control': 'public,max-age=31536000,immutable',
          'Content-Type': mime ?? 'application/octet-stream',
        });
        await blockAsset.update({
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

  let s3Available = true;

  try {
    initS3Client({
      accessKey: argv.s3AccessKey,
      endPoint: argv.s3Host,
      port: argv.s3Port,
      secretKey: argv.s3SecretKey,
      useSSL: argv.s3Secure,
    });
  } catch (error: unknown) {
    s3Available = false;
    logger.warn(`S3Error: ${error}`);
    logger.warn('Block asset migration will not work correctly without S3 access.');
  }

  const result = await migrateBlockAssetsToS3(options);
  await db.close();

  if (!s3Available || result.failed > 0 || result.skipped > 0) {
    logger.error(
      `Block asset migration finished with ${result.failed} failure(s) and ${result.skipped} skipped asset(s).`,
    );
    process.exit(1);
  }

  process.exit();
}
