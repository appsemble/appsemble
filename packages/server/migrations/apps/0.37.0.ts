import { logger } from '@appsemble/node-utils';
import { DataTypes, type QueryOptions, type Sequelize, type Transaction } from 'sequelize';

export const key = '0.37.0';

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

  async function addColumnIfMissing(
    table: string,
    column: string,
    attribute: Parameters<typeof queryInterface.addColumn>[2],
  ): Promise<void> {
    // `describeTable` forwards its options to `sequelize.query`, so it honours the transaction at
    // runtime even though its type definition omits it.
    const columns = await queryInterface.describeTable(table, { transaction } as QueryOptions);
    if (!(column in columns)) {
      await queryInterface.addColumn(table, column, attribute, { transaction });
    }
  }

  logger.info('Adding `AppOAuth2Secret.roleMappings`');
  await addColumnIfMissing('AppOAuth2Secret', 'roleMappings', { type: DataTypes.JSON });

  logger.info('Adding `AppSamlSecret.groupAttribute`');
  await addColumnIfMissing('AppSamlSecret', 'groupAttribute', { type: DataTypes.STRING });

  logger.info('Adding `AppSamlSecret.roleMappings`');
  await addColumnIfMissing('AppSamlSecret', 'roleMappings', { type: DataTypes.JSON });
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
