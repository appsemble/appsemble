import { logger } from '@appsemble/node-utils';
import { DataTypes, Sequelize } from 'sequelize';

export const key = '0.15.12';

/**
 * Symmary:
 * - Add annotations to Team table
 *
 * @param db - The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Adding annotations to Team table');
  await queryInterface.addColumn('Team', 'annotations', {
    type: DataTypes.JSON,
  });
}

/**
 * Symmary:
 * - Remove annotations from Team table
 *
 * @param db - The sequelize database.
 */
export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  logger.info('Removing annotations from Team table');
  await queryInterface.removeColumn('Team', 'annotations');
}
