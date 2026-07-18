import { logger } from '@appsemble/node-utils';
import { DataTypes, QueryTypes, type Sequelize, type Transaction } from 'sequelize';

export const key = '0.37.2';

/**
 * Summary:
 * - Allow `BlockAsset.content` to be null for S3-backed block assets.
 * - Add `storageKey` column to table `BlockAsset`.
 * - Add `size` column to table `BlockAsset`.
 */

export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Allow null values for `content` in `BlockAsset` table');
  await queryInterface.changeColumn(
    'BlockAsset',
    'content',
    {
      type: DataTypes.BLOB,
      allowNull: true,
    },
    { transaction },
  );

  logger.info('Add column `storageKey` to table `BlockAsset`');
  await queryInterface.addColumn(
    'BlockAsset',
    'storageKey',
    {
      type: DataTypes.STRING,
      allowNull: true,
    },
    { transaction },
  );

  logger.info('Add column `size` to table `BlockAsset`');
  await queryInterface.addColumn(
    'BlockAsset',
    'size',
    {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    { transaction },
  );
}

/**
 * Summary:
 * - Remove `size` column from `BlockAsset`.
 * - Remove `storageKey` column from `BlockAsset`.
 * - Disallow null values for `BlockAsset.content` again.
 */

export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Remove column `size` from `BlockAsset` table');
  await queryInterface.removeColumn('BlockAsset', 'size', { transaction });

  logger.info('Remove column `storageKey` from `BlockAsset` table');
  await queryInterface.removeColumn('BlockAsset', 'storageKey', { transaction });

  // Rows migrated to S3 have null `content`, and their bytes live in object storage, so the NOT
  // NULL constraint cannot be restored here without dropping data. Only re-add it when every row
  // still has database content; otherwise leave `content` nullable so this down migration can
  // never fail or lose data.
  const [{ count }] = await queryInterface.sequelize.query<{ count: number }>(
    'SELECT COUNT(*)::int AS count FROM "BlockAsset" WHERE content IS NULL',
    { type: QueryTypes.SELECT, transaction },
  );

  if (count > 0) {
    logger.warn(
      `Leaving \`content\` nullable in \`BlockAsset\`: ${count} row(s) have their content in S3 only.`,
    );
    return;
  }

  logger.info('Disallow null values for `content` in `BlockAsset` table');
  await queryInterface.changeColumn(
    'BlockAsset',
    'content',
    {
      type: DataTypes.BLOB,
      allowNull: false,
    },
    { transaction },
  );
}
