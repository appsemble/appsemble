import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize } from 'sequelize';

export const key = '0.27.13';

/**
 * Summary:
 * - Change the data column of the Resource table.
 *
 * @param db The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Changing the data column of the `Resource` table');
  await queryInterface.changeColumn('Resource', 'data', { type: DataTypes.JSONB });
}

/**
 * Summary:
 * - Change the data column of the Resource table.
 *
 * @param db The sequelize Database.
 */
export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Changing the data column of the `Resource` table');
  await queryInterface.changeColumn('Resource', 'data', { type: DataTypes.JSON });
}
