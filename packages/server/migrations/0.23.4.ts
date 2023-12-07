import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize } from 'sequelize';

export const key = '0.23.4';

/**
 * Summary:
 * - Add column App.enableSelfRegistration
 *
 * @param db The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Adding column App.enableSelfRegistration');
  await queryInterface.addColumn('App', 'enableSelfRegistration', {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  });
}

/**
 * Summary:
 * - Remove column App.enableSelfRegistration
 *
 * @param db The sequelize database.
 */
export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Removing column App.enableSelfRegistration');
  await queryInterface.removeColumn('App', 'enableSelfRegistration');
}
