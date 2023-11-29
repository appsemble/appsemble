import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize } from 'sequelize';

export const key = '0.23.3';

/**
 * Summary:
 * - Add column App.controllerCode
 * - Add column App.controllerImplementations
 *
 * @param db The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Adding column App.controllerCode');
  await queryInterface.addColumn('App', 'controllerCode', DataTypes.TEXT);

  logger.info('Adding column App.controllerImplementations');
  await queryInterface.addColumn('App', 'controllerImplementations', DataTypes.JSON);
}

/**
 * Summary:
 * - Remove column App.controllerCode
 * - Remove column App.controllerImplementations
 *
 * @param db The sequelize database.
 */
export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Removing column App.controllerCode');
  await queryInterface.removeColumn('App', 'controllerCode');

  logger.info('Removing column App.controllerImplementations');
  await queryInterface.removeColumn('App', 'controllerImplementations');
}
