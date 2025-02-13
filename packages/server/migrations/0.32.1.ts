import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize, type Transaction } from 'sequelize';

export const key = '0.32.1';

/**
 * Summary:
 * - Remove column `data` from `Asset` table
 * - Remove column `OriginalId` from `Asset` table
 */

export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

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
