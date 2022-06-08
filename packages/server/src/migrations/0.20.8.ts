import { logger } from '@appsemble/node-utils';
import { DataTypes, Sequelize } from 'sequelize';

export const key = '0.20.8';

/**
 * Summary:
 * - Add column `example` to `BlockVersion`
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
 * - Remove column `example` from `BlockVersion`
 *
 * @param db - The sequelize database.
 */
export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Removing column `BlockVersion`.`examples`');
  await queryInterface.removeColumn('BlockVersion', 'examples');
}
