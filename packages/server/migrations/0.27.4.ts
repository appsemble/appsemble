import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize } from 'sequelize';

export const key = '0.27.4';

/**
 * Summary:
 * - Add column `enableUnsecuredServiceSecrets` to `App`
 *
 * @param db The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Add new column `enableUnsecuredServiceSecrets` to table `App`');
  await queryInterface.addColumn('App', 'enableUnsecuredServiceSecrets', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  });
}

/**
 * Summary:
 * - Remove column `enableUnsecuredServiceSecrets` to `App`
 *
 * @param db The sequelize database.
 */
export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Removing column `enableUnsecuredServiceSecrets` to table `App`');
  await queryInterface.removeColumn('App', 'enableUnsecuredServiceSecrets');
}
