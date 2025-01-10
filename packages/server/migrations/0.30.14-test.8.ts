import { AppsembleError, initS3Client, logger, uploadS3File } from '@appsemble/node-utils';
import { DataTypes, QueryTypes, type Sequelize, type Transaction } from 'sequelize';

import { argv } from '../utils/argv.js';

export const key = '0.30.14-test.8';

/**
 * Summary:
 * - Migrate assets data to s3
 * - Remove column `data` from `Asset` table
 * - Remove column `OriginalId` from `Asset` table
 */

export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  try {
    initS3Client({
      endPoint: argv.s3Host,
      port: argv.s3Port,
      useSSL: argv.s3Ssl,
      accessKey: argv.s3AccessKey,
      secretKey: argv.s3SecretKey,
    });
  } catch (error: unknown) {
    throw new AppsembleError(`S3Error: ${error}`);
  }

  const queryInterface = db.getQueryInterface();

  const batchSize = 10;
  let offset = 0;
  let hasMoreRows = true;

  while (hasMoreRows) {
    const result: { id: string; data: Buffer; AppId: number }[] =
      await queryInterface.sequelize.query(
        `
      SELECT id, data, "AppId"
      FROM "Asset"
      ORDER BY id
      LIMIT :batchSize OFFSET :offset
    `,
        {
          replacements: { batchSize, offset },
          transaction,
          type: QueryTypes.SELECT,
        },
      );

    if (result.length === 0) {
      hasMoreRows = false;
      break;
    }

    await Promise.all(
      result.map(async (row) => {
        try {
          await uploadS3File(`app-${row.AppId}`, row.id, row.data);
          await queryInterface.sequelize.query(
            `
          DELETE FROM "Asset"
          WHERE id = :id
          `,
            {
              replacements: { id: row.id },
              transaction,
              type: QueryTypes.DELETE,
            },
          );
        } catch (error) {
          logger.error(`Error processing asset ${row.id}:`, error);
          throw error;
        }
      }),
    );

    logger.info(`Batch with offset ${offset} processed.`);
    offset += batchSize;
  }

  logger.info('Remove column `OriginalId` from `Asset` table');
  await queryInterface.removeColumn('Asset', 'OriginalId', { transaction });

  logger.info('Remove column `data` from `Asset` table');
  await queryInterface.removeColumn('Asset', 'data', { transaction });
}

/**
 * Summary:
 * - Add column `data` to `Asset` table
 * - Add column `OriginalId` to `Asset` table
 */

export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Add column `data` to `Asset` table');
  await queryInterface.addColumn(
    'Asset',
    'data',
    {
      type: DataTypes.BLOB,
      allowNull: false,
    },
    { transaction },
  );

  logger.info('Add column `OriginalId` to `Asset` table');
  await queryInterface.addColumn(
    'Asset',
    'OriginalId',
    {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'Asset',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    { transaction },
  );
}
