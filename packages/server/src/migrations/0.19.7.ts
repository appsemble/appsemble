import { logger } from '@appsemble/node-utils';
import { DataTypes, Sequelize } from 'sequelize';

export const key = '0.19.7';

/**
 * Summary:
 * - Add column `listed` to `App`
 * - Remove column `private` from `App`
 *
 * @param db - The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  logger.info('Adding column `listed` to `App');
  await queryInterface.addColumn('App', 'listed', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  });
  await db.query('UPDATE "App" set listed = NOT private');
  logger.info('Removing column `private` from `App`');
  await queryInterface.removeColumn('App', 'private');
}

/**
 * Summary:
 * - Add column `private` to `App`
 * - Remove column `listed` from `App`
 *
 * @param db - The sequelize database.
 */
export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  logger.info('Adding column `private` to `App');
  await queryInterface.addColumn('App', 'private', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  });
  await db.query('UPDATE "App" set private = NOT listed');
  logger.info('Removing column `listed` from `App`');
  await queryInterface.removeColumn('App', 'listed');
}
