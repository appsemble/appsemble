import { logger } from '@appsemble/node-utils';
import { type Sequelize, type Transaction } from 'sequelize';

export const key = '0.33.6';

/**
 * Summary:
 * - Change unique asset indexes to disregard deleted
 */

export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Remove index `UniqueAssetWithGroupId` from `Asset` table');
  await queryInterface.removeIndex('Asset', 'UniqueAssetWithGroupId', { transaction });

  logger.info('Remove index `UniqueAssetWithNullGroupId` from `Asset` table');
  await queryInterface.removeIndex('Asset', 'UniqueAssetWithNullGroupId', { transaction });

  logger.info('Add index `UniqueAssetWithGroupId` to `Asset` table');
  await queryInterface.sequelize.query(
    `
    CREATE UNIQUE INDEX "UniqueAssetWithGroupId"
    ON "Asset" (name, ephemeral, "AppId", "GroupId")
    WHERE "GroupId" IS NOT NULL AND "deleted" IS NULL;
  `,
    { transaction },
  );

  logger.info('Add index `UniqueAssetWithNullGroupId` to `Asset` table');
  await queryInterface.sequelize.query(
    `
    CREATE UNIQUE INDEX "UniqueAssetWithNullGroupId"
    ON "Asset" (name, ephemeral, "AppId")
    WHERE "GroupId" IS NULL AND "deleted" IS NULL;
  `,
    { transaction },
  );
}

/**
 * Summary:
 * - Change unique asset indexes to take deleted into account
 */

export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Remove index `UniqueAssetWithGroupId` from `Asset` table');
  await queryInterface.removeIndex('Asset', 'UniqueAssetWithGroupId', { transaction });

  logger.info('Remove index `UniqueAssetWithNullGroupId` from `Asset` table');
  await queryInterface.removeIndex('Asset', 'UniqueAssetWithNullGroupId', { transaction });

  logger.info('Add index `UniqueAssetWithGroupId` to `Asset` table');
  await queryInterface.sequelize.query(
    `
      CREATE UNIQUE INDEX "UniqueAssetWithGroupId"
        ON "Asset" (name, ephemeral, "AppId", "GroupId")
        WHERE "GroupId" IS NOT NULL;
    `,
    { transaction },
  );

  logger.info('Add index `UniqueAssetWithNullGroupId` to `Asset` table');
  await queryInterface.sequelize.query(
    `
    CREATE UNIQUE INDEX "UniqueAssetWithNullGroupId"
    ON "Asset" (name, ephemeral, "AppId")
    WHERE "GroupId" IS NULL;
  `,
    { transaction },
  );
}
