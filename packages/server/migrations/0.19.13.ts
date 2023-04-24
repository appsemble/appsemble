import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize } from 'sequelize';

export const key = '0.19.13';

/**
 * Summary:
 * - Add column `Resource`.`EditorId`.
 *
 * @param db The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Adding column `Resource`.`EditorId`');
  await queryInterface.addColumn('Resource', 'EditorId', {
    type: DataTypes.UUID,
    references: {
      model: 'User',
      key: 'id',
    },
  });
}

/**
 * Summary:
 * - Remove column `Resource`.`EditorId`.
 *
 * @param db The sequelize database.
 */
export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Removing column `Resource`.`EditorId`');
  await queryInterface.removeColumn('Resource', 'EditorId');
}
