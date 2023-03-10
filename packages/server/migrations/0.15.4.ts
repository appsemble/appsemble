import { logger } from '@appsemble/node-utils';
import { DataTypes, Sequelize } from 'sequelize';

export const key = '0.15.4';

/**
 * Summary:
 * - Add `icon` to Organization
 *
 * @param db The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Adding column icon to Organization');
  await queryInterface.addColumn('Organization', 'icon', { type: DataTypes.BLOB });
}

/**
 * Summary:
 * - Drop the `icon` column from Organization
 *
 * @param db The sequelize database.
 */
export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Adding column icon to Organization');
  await queryInterface.removeColumn('Organization', 'icon');
}
