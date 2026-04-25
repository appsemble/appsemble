import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize, type Transaction } from 'sequelize';

export const key = '0.36.7';

/**
 * Summary:
 * - Allow `BlockAsset.content` to be null for S3-backed block assets.
 * - Add `storageKey` column to table `BlockAsset`.
 * - Add `size` column to table `BlockAsset`.
 *
 * @param transaction The sequelize Transaction.
 * @param db The sequelize database.
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
 *
 * @param transaction The sequelize Transaction.
 * @param db The sequelize database.
 */
export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Remove column `size` from `BlockAsset` table');
  await queryInterface.removeColumn('BlockAsset', 'size', { transaction });

  logger.info('Remove column `storageKey` from `BlockAsset` table');
  await queryInterface.removeColumn('BlockAsset', 'storageKey', { transaction });

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
