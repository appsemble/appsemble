import { logger } from '@appsemble/node-utils';
import { DataTypes, Sequelize } from 'sequelize';

export const key = '0.20.2';

/**
 * Summary:
 * - Add `visibility` to BlockVersion table
 *
 * @param db - The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Adding column `visibility` to table `BlockVersion`');
  await queryInterface.addColumn('BlockVersion', 'visibility', {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'public',
  });
}

/**
 * Summary:
 * - Add `visibility` from BlockVersion table
 *
 * @param db - The sequelize database.
 */
export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Removing column `visibility` to from `BlockVersion`');
  await queryInterface.removeColumn('BlockVersion', 'visibility');
}
