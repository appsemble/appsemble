import { logger } from '@appsemble/node-utils';
import { DataTypes, Sequelize } from 'sequelize';

export const key = '0.16.2';

/**
 * Summary:
 * - Add column AppSamlSecret.emailAttribute
 * - Add column AppSamlSecret.nameAttribute
 *
 * @param db The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Adding column AppSamlSecret.emailAttribute');
  await queryInterface.addColumn('AppSamlSecret', 'emailAttribute', DataTypes.STRING);

  logger.info('Adding column AppSamlSecret.nameAttribute');
  await queryInterface.addColumn('AppSamlSecret', 'nameAttribute', DataTypes.STRING);
}

/**
 * Summary:
 * - Remove column AppSamlSecret.nameAttribute
 * - Remove column AppSamlSecret.emailAttribute
 *
 * @param db The sequelize database.
 */
export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Removing column AppSamlSecret.emailAttribute');
  await queryInterface.removeColumn('AppSamlSecret', 'emailAttribute');

  logger.info('Removing column AppSamlSecret.nameAttribute');
  await queryInterface.removeColumn('AppSamlSecret', 'nameAttribute');
}
