import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize } from 'sequelize';

export const key = '0.25.0';

/**
 * Summary:
 * - Add column `seed` from `App`
 * - Update demo apps to use `seed` true.
 *
 * @param db The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Adding new column `locked-temp` locked to table `App`');
  await queryInterface.addColumn('App', 'seed', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  });

  logger.info('Setting column `seed` to true where column `demo` = true for `App` table');
  await queryInterface.bulkUpdate('App', { demoMode: true }, { seed: true });
}

/**
 * Summary:
 * - Remove column `seed` from `App`
 *
 * @param db The sequelize database.
 */
export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Removing column `seed` in table `App`');
  await queryInterface.removeColumn('App', 'seed');
}
