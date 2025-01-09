import { logger } from '@appsemble/node-utils';
import { DataTypes, QueryTypes, type Sequelize, type Transaction } from 'sequelize';

import { uploadFile } from '../utils/s3.js';

export const key = '0.30.14-test.8';

/**
 * Summary:
 * - Add column `ca` to `AppServiceSecret` table
 */

export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  const batchSize = 10;
  let offset = 0;
  let hasMoreRows = true;

  while (hasMoreRows) {
    const query = `
      SELECT "Asset".id, "Asset".data, "App"."OrganizationId"
      FROM "Asset"
      JOIN "App" ON "Asset"."AppId" = "App".id
      ORDER BY "Asset".id
      LIMIT :batchSize OFFSET :offset
    `;

    const result: { id: number; data: Buffer; AppId: number; App: { OrganizationId: string } }[] =
      await db.query(query, {
        replacements: { batchSize, offset },
        transaction,
        type: QueryTypes.SELECT,
      });

    if (result.length === 0) {
      hasMoreRows = false;
      break;
    }

    await Promise.all(
      result.map(async (row) => {
        try {
          await uploadFile(`${row.App.OrganizationId}-${row.AppId}`, row.id, row.data);

          const updateQuery = `
            UPDATE "Asset"
            SET data = NULL
            WHERE id = :id
          `;

          await queryInterface.sequelize.query(updateQuery, {
            replacements: { id: row.id },
            transaction,
          });
        } catch (error) {
          logger.error(`Error processing asset ${row.id}:`, error);
          throw error;
        }
      }),
    );

    logger.info(`Batch with offset ${offset} processed.`);
    offset += batchSize;
  }
}

/**
 * Summary:
 * - Remove column `ca` from `AppServiceSecret` table
 */

export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Remove column `ca` from `AppServiceSecret` table');
  await queryInterface.removeColumn('AppServiceSecret', 'ca');
}
