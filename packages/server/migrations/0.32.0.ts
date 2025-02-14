import { logger, uploadS3File } from '@appsemble/node-utils';
import { DataTypes, QueryTypes, type Sequelize, type Transaction } from 'sequelize';

export const key = '0.32.0';

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
