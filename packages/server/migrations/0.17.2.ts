import { logger } from '@appsemble/node-utils';
import { DataTypes, Sequelize } from 'sequelize';

export const key = '0.17.2';

/**
 * Summary:
 * - Add column App.longDescription
 *
 * @param db - The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Adding column App.longDescription');
  await queryInterface.addColumn('App', 'longDescription', DataTypes.TEXT);
}

/**
 * Summary:
 * - Remove column App.longDescription
 *
 * @param db - The sequelize database.
 */
export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Removing column App.longDescription');
  await queryInterface.removeColumn('App', 'longDescription');
}
