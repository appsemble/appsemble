import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize, type Transaction } from 'sequelize';

export const key = '0.27.0';

/**
 * Summary:
 * - Remove column `seed` from `App`
 *
 * @param transaction The sequelize Transaction.
 * @param db The sequelize database.
 */
export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Removing column `seed` from table `App`');
  await queryInterface.removeColumn('App', 'seed', { transaction });
}

/**
 * Summary:
 * - Add column `seed` to `App`
 *
 * @param transaction The sequelize Transaction.
 * @param db The sequelize database.
 */
export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Adding new column `seed` to table `App`');
  await queryInterface.addColumn(
    'App',
    'seed',
    {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    { transaction },
  );
}
