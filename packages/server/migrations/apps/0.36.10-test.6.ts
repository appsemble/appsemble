import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize, type Transaction } from 'sequelize';

export const key = '0.36.10-test.6';

/**
 * Summary:
 * - Add external group-to-role mapping configuration to app OAuth2 secrets.
 * - Add external group attribute and group-to-role mapping configuration to app SAML secrets.
 *
 * @param transaction Sequelize transaction
 * @param db The Sequelize Database.
 */
export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Adding `AppOAuth2Secret.roleMappings`');
  await queryInterface.addColumn(
    'AppOAuth2Secret',
    'roleMappings',
    { type: DataTypes.JSON },
    { transaction },
  );

  logger.info('Adding `AppSamlSecret.groupAttribute`');
  await queryInterface.addColumn(
    'AppSamlSecret',
    'groupAttribute',
    { type: DataTypes.STRING },
    { transaction },
  );

  logger.info('Adding `AppSamlSecret.roleMappings`');
  await queryInterface.addColumn(
    'AppSamlSecret',
    'roleMappings',
    { type: DataTypes.JSON },
    { transaction },
  );
}

/**
 * Summary:
 * - Remove external group-to-role mapping configuration from app OAuth2 secrets.
 * - Remove external group attribute and group-to-role mapping configuration from app SAML secrets.
 *
 * @param transaction Sequelize transaction
 * @param db The Sequelize Database.
 */
export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Dropping `AppSamlSecret.roleMappings`');
  await queryInterface.removeColumn('AppSamlSecret', 'roleMappings', { transaction });

  logger.info('Dropping `AppSamlSecret.groupAttribute`');
  await queryInterface.removeColumn('AppSamlSecret', 'groupAttribute', { transaction });

  logger.info('Dropping `AppOAuth2Secret.roleMappings`');
  await queryInterface.removeColumn('AppOAuth2Secret', 'roleMappings', { transaction });
}
