import { logger } from '@appsemble/node-utils';
import { DataTypes, Sequelize } from 'sequelize';

export const key = '0.15.2';

/**
 * Symmary:
 * - Add the `OAuth2Consent` table.
 *
 * @param db - The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Adding column icon to Organization');
  await queryInterface.addColumn('Organization', 'icon', { type: DataTypes.BLOB });
}

/**
 * Symmary:
 * - Drop the `OAuth2Consent` table.
 *
 * @param db - The sequelize database.
 */
export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  logger.info('Removing table OAuth2Consent');
  await queryInterface.dropTable('OAuth2Consent');
}
