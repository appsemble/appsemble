import { logger } from '@appsemble/node-utils';
import { DataTypes, Sequelize } from 'sequelize';

export const key = '0.17.3';

/**
 * Summary:
 * - Add column App.longDescription
 *
 * @param db - The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Adding column App.adaptiveIcon');
  await queryInterface.addColumn('App', 'adaptiveIcon', DataTypes.BLOB);

  logger.info('Adding column App.iconBackground');
  await queryInterface.addColumn('App', 'iconBackground', DataTypes.STRING);
}

/**
 * Summary:
 * - Remove column App.longDescription
 *
 * @param db - The sequelize database.
 */
export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Removing column App.iconBackground');
  await queryInterface.removeColumn('App', 'iconBackground');

  logger.info('Removing column App.adaptiveIcon');
  await queryInterface.removeColumn('App', 'adaptiveIcon');
}
