import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize, type Transaction } from 'sequelize';

export const key = '0.28.0';

/**
 * Summary:
 * - Change the data column of the Resource table.
 *
 * @param transaction The sequelize Transaction.
 * @param db The sequelize database.
 */
export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Changing the data column of the `Resource` table');
  await queryInterface.changeColumn('Resource', 'data', { type: DataTypes.JSONB }, { transaction });
}

/**
 * Summary:
 * - Change the data column of the Resource table.
 *
 * @param transaction The sequelize Transaction.
 * @param db The sequelize Database.
 */
export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Changing the data column of the `Resource` table');
  await queryInterface.changeColumn(
    'Resource',
    'data',
    { type: DataTypes.JSON, allowNull: false },
    { transaction },
  );
}
