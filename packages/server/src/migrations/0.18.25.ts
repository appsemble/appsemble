import { logger } from '@appsemble/node-utils';
import { DataTypes, QueryTypes, Sequelize } from 'sequelize';

export const key = '0.18.25';

/**
 * Summary:
 * - Add column `wildcardActions` to table `BlockVersion`.
 *
 * @param db - The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Adding column wildcardActions to BlockVersion');
  await queryInterface.addColumn('BlockVersion', 'wildcardActions', {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  });

  logger.info('Updating existing block versions to have `wildcardActions` set to `false`');
  await db.query('UPDATE "BlockVersion" SET "wildcardActions" = false;', {
    type: QueryTypes.UPDATE,
  });

  logger.info('Updating `wildcardActions` in `BlockVersion` to not be nullable');
  await queryInterface.changeColumn('BlockVersion', 'wildcardActions', {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  });
}

/**
 * Summary:
 * - Remove column `wildcardActions` from table `BlockVersion`.
 *
 * @param db - The sequelize database.
 */
export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.warn('Removing column wildcardActions from BlockVersion');
  await queryInterface.removeColumn('BlockVersion', 'wildcardActions');
}
