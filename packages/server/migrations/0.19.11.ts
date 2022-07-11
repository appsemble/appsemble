import { logger } from '@appsemble/node-utils';
import { DataTypes, Sequelize } from 'sequelize';

export const key = '0.19.11';

/**
 * Summary:
 * - Add column `emailName` to table `App`
 *
 * @param db The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  logger.info('Adding column `emailName` to `App`');
  await queryInterface.addColumn('App', 'emailName', {
    type: DataTypes.STRING,
  });
}

/**
 * Summary:
 * - Remove column `emailName` from table `App`
 *
 * @param db The sequelize database.
 */
export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Removing column `emailName` from `App`');
  await queryInterface.removeColumn('App', 'emailName');
}
