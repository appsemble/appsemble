import { logger } from '@appsemble/node-utils';
import { Sequelize } from 'sequelize';

export const key = '0.19.15';

/**
 * Summary:
 * - Wipe Theme table
 *
 * @param db The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.warn('Deleting all entries from Theme table');
  await queryInterface.bulkDelete('Theme', {});
}

/**
 * Summary:
 * - Wipe Theme table
 *
 * @param db The sequelize database.
 */
export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.warn('Deleting all entries from Theme table');
  await queryInterface.bulkDelete('Theme', {});
}
