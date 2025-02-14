import { logger, uploadS3File } from '@appsemble/node-utils';
import { DataTypes, QueryTypes, type Sequelize, type Transaction } from 'sequelize';

export const key = '0.32.1-test.0';

/**
 * Summary:
 * - Migrate assets data to s3
 * - Make `data` column on table `Asset` nullable
 */

export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
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
      WHERE deleted IS NULL
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

    for (const row of result) {
      try {
        if (row.data) {
          await uploadS3File(`app-${row.AppId}`, row.id, row.data);
        } else {
          logger.warn(`Asset ${row.id} data has not loaded into memory`);
        }
      } catch (error) {
        logger.error(`Error processing asset ${row.id}:`, error);
        throw error;
      }
    }

    logger.info(`Batch with offset ${offset} processed.`);
    offset += batchSize;
  }

  logger.info('Changing column `data` on `Asset` table to nullable');
  await queryInterface.changeColumn(
    'Asset',
    'data',
    {
      type: DataTypes.BLOB,
      allowNull: true,
    },
    { transaction },
  );
}

/**
 * Summary:
 * - Make `data` column on table `Asset` not nullable
 */

export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Changing column `data` on `Asset` table to not nullable');
  await queryInterface.changeColumn(
    'Asset',
    'data',
    {
      type: DataTypes.BLOB,
      allowNull: false,
    },
    { transaction },
  );
}
