import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize, type Transaction } from 'sequelize';

export const key = '0.30.9';

/**
 * Summary:
 * - Add column `OriginalId` to `Asset` table
 */

export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Add column `OriginalId` to `Asset` table');
  await queryInterface.addColumn('Asset', 'OriginalId', {
    type: DataTypes.STRING,
    allowNull: true,
    references: {
      model: 'Asset',
      key: 'id',
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
}

/**
 * Summary:
 * - Remove column `OriginalId` from `Asset` table
 */

export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Remove column `OriginalId` from `Asset` table');
  await queryInterface.removeColumn('Asset', 'OriginalId');
}
