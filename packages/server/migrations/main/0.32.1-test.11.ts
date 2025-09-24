import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize, type Transaction } from 'sequelize';

export const key = '0.32.1-test.11';

/**
 * Summary:
 * - Add column displayInstallationPrompt to table App.
 *
 * @param transaction The sequelize transaction.
 * @param db The sequelize database.
 */
export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  logger.info('Add column `displayInstallationPrompt` to table `App`');
  await queryInterface.addColumn(
    'App',
    'displayInstallationPrompt',
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
 * - Remove column displayInstallationPrompt from table App.
 *
 * @param transaction The sequelize transaction.
 * @param db The sequelize database.
 */
export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  logger.info('Removing column `displayInstallationPrompt` from table `App`');
  await queryInterface.removeColumn('App', 'displayInstallationPrompt', { transaction });
}
