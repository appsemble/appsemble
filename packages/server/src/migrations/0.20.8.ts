import { logger } from '@appsemble/node-utils';
import { DataTypes, Sequelize } from 'sequelize';

export const key = '0.20.8';

/**
 * Summary:
 * - Add table `TeamInvite`
 * - Convert all path references for apps to use the page name instead of the index.
 *
 * @param db - The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Adding column `BlockVersion`.`examples`');
  await queryInterface.addColumn('BlockVersion', 'examples', { type: DataTypes.JSONB });
}

/**
 * Summary:
 * - Convert all path references for apps to use the page index instead of the name.
 * - Remove table `TeamInvite`
 *
 * @param db - The sequelize database.
 */
export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Removing column `BlockVersion`.`examples`');
  await queryInterface.removeColumn('BlockVersion', 'examples');
}
