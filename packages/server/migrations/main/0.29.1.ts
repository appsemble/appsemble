import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize, type Transaction } from 'sequelize';

export const key = '0.29.1';

/**
 * Summary:
 * - Add column `containers` to table `App`
 * - Add column `registry` to table `App`
 *
 * @param transaction The sequelize Transaction.
 * @param db The sequelize database.
 */
export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Add column `containers` to table `App`');
  await queryInterface.addColumn(
    'App',
    'containers',
    {
      type: DataTypes.JSON,
      allowNull: true,
    },
    { transaction },
  );

  logger.info('Add column `registry` to table `App`');
  await queryInterface.addColumn(
    'App',
    'registry',
    {
      type: DataTypes.STRING,
      allowNull: true,
    },
    { transaction },
  );
}

/**
 * Summary:
 * - Remove column `containers` from table `App`
 *
 * - Remove column `registry` from table `App`
 *
 * @param transaction The sequelize Transaction.
 * @param db The sequelize database.
 */
export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Removing column `containers` from table `App`');
  await queryInterface.removeColumn('App', 'containers', { transaction });

  logger.info('Removing column `registry` from table `App`');
  await queryInterface.removeColumn('App', 'registry', { transaction });
}
