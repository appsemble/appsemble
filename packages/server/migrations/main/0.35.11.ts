import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize, type Transaction } from 'sequelize';

export const key = '0.35.10';

/**
 * Summary:
 * - Add new column `supportedLanguages` to table `App`
 *
 * @param transaction The sequelize transaction.
 * @param db The sequelize database.
 */
export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  logger.info('Adding column `supportedLanguages` to table `App`');
  await queryInterface.addColumn(
    'App',
    'supportedLanguages',
    { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: true },
    {
      transaction,
    },
  );
  logger.info('Setting supportedLanguages to the defaultLanguage defined in the app definition');
  await queryInterface.sequelize.query(
    `
UPDATE "App"
SET "supportedLanguages" = CASE
  WHEN definition->>'defaultLanguage' IS NOT NULL THEN ARRAY[definition->>'defaultLanguage']
  ELSE ARRAY['en']
END;
`,
    { transaction },
  );
}

/**
 * Summary:
 * - Remove column `supportedLanguages` from table `App`
 *
 * @param transaction The sequelize transaction.
 * @param db The sequelize database.
 */
export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  logger.info('Removing column `supportedLanguages` from table `App`');
  await queryInterface.removeColumn('App', 'supportedLanguages', { transaction });
}
