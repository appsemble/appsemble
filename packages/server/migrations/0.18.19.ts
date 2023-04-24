import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize } from 'sequelize';

export const key = '0.18.19';

/**
 * Summary:
 * - Remove column `resources` from table `BlockVersion`.
 *
 * @param db The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  logger.info('Removing column resources from BlockVersion');
  await queryInterface.removeColumn('BlockVersion', 'resources');
}

/**
 * Summary:
 * - Add column `resources` to table `BlockVersion`.
 *
 * @param db The sequelize database.
 */
export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  logger.info('Adding column resources to BlockVersion');
  await queryInterface.addColumn('BlockVersion', 'resources', {
    type: DataTypes.JSON,
  });
}
