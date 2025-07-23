import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize, type Transaction } from 'sequelize';

export const key = '0.25.0';

/**
 * Summary:
 * - Add column `seed` from `App`
 * - Update demo apps to use `seed` true.
 *
 * @param transaction The sequelize Transaction.
 * @param db The sequelize database.
 */
export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
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

  logger.info('Setting column `seed` to true where column `demoMode` = true for `App` table');
  await queryInterface.bulkUpdate('App', { seed: true }, { demoMode: true }, { transaction });
}

/**
 * Summary:
 * - Remove column `seed` from `App`
 *
 * @param transaction The sequelize Transaction.
 * @param db The sequelize database.
 */
export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Removing column `seed` in table `App`');
  await queryInterface.removeColumn('App', 'seed', { transaction });
}
