import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize, type Transaction } from 'sequelize';

export const key = '0.37.2';

/**
 * Summary:
 * - Add `storageKey` column to table `BlockAsset`.
 * - Add `size` column to table `BlockAsset`.
 */

export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Add column `storageKey` to table `BlockAsset`');
  await queryInterface.addColumn(
    'BlockAsset',
    'storageKey',
    {
      type: DataTypes.TEXT,
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
 */

export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Remove column `size` from `BlockAsset` table');
  await queryInterface.removeColumn('BlockAsset', 'size', { transaction });

  logger.info('Remove column `storageKey` from `BlockAsset` table');
  await queryInterface.removeColumn('BlockAsset', 'storageKey', { transaction });
}
