import { logger } from '@appsemble/node-utils';
import { DataTypes, Sequelize } from 'sequelize';

export const key = '0.17.0';

/**
 * Summary:
 * - Add column SamlLoginRequest.email
 *
 * @param db - The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Adding column SamlLoginRequest.email');
  await queryInterface.addColumn('SamlLoginRequest', 'email', DataTypes.STRING);

  logger.info('Adding column SamlLoginRequest.nameId');
  await queryInterface.addColumn('SamlLoginRequest', 'nameId', DataTypes.STRING);
}

/**
 * Summary:
 * - Remove column SamlLoginRequest.email
 *
 * @param db - The sequelize database.
 */
export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Removing column SamlLoginRequest.nameId');
  await queryInterface.removeColumn('SamlLoginRequest', 'nameId');

  logger.info('Removing column SamlLoginRequest.email');
  await queryInterface.removeColumn('SamlLoginRequest', 'email');
}
