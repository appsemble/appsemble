import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize, type Transaction } from 'sequelize';

export const key = '0.31.1-test.4';

/**
 * Summary:
 * - Add column displayAppMemberName to table App.
 *
 * @param transaction The sequelize transaction.
 * @param db The sequelize database.
 */
export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  logger.info('Add column `displayAppMemberName` to table `App`');
  await queryInterface.addColumn(
    'App',
    'displayAppMemberName',
    {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: true,
    },
    { transaction },
  );
}

/**
 * Summary:
 * - Remove column displayAppMemberName from table App.
 *
 * @param transaction The sequelize transaction.
 * @param db The sequelize database.
 */
export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  logger.info('Removing column `displayAppMemberName` from table `App`');
  await queryInterface.removeColumn('App', 'displayAppMemberName', { transaction });
}
