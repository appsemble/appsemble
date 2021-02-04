import { logger } from '@appsemble/node-utils';
import { DataTypes, Sequelize } from 'sequelize';

export const key = '0.17.6';

/**
 * Summary:
 * - Add column App.locked
 *
 * @param db - The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Adding column App.locked');
  await queryInterface.addColumn('App', 'locked', DataTypes.BOOLEAN);
}

/**
 * Summary:
 * - Remove column App.locked
 *
 * @param db - The sequelize database.
 */
export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Removing column App.locked');
  await queryInterface.removeColumn('App', 'locked');
}
