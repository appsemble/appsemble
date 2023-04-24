import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize } from 'sequelize';

export const key = '0.17.3';

/**
 * Summary:
 * - Add column App.maskableIcon
 * - Add column App.iconBackground
 *
 * @param db The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Adding column App.maskableIcon');
  await queryInterface.addColumn('App', 'maskableIcon', DataTypes.BLOB);

  logger.info('Adding column App.iconBackground');
  await queryInterface.addColumn('App', 'iconBackground', DataTypes.STRING);
}

/**
 * Summary:
 * - Remove column App.maskableIcon
 * - Remove column App.iconBackground
 *
 * @param db The sequelize database.
 */
export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Removing column App.iconBackground');
  await queryInterface.removeColumn('App', 'iconBackground');

  logger.info('Removing column App.maskableIcon');
  await queryInterface.removeColumn('App', 'maskableIcon');
}
