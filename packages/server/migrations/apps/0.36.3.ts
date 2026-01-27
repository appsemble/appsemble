import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize, type Transaction } from 'sequelize';

export const key = '0.36.3';

/**
 * Summary:
 * - Add TOTP columns to `AppMember` table for two-factor authentication.
 *
 * @param transaction Sequelize transaction
 * @param db The Sequelize Database.
 */
export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Adding `totpSecret` column to `AppMember` table');
  await queryInterface.addColumn(
    'AppMember',
    'totpSecret',
    {
      type: DataTypes.BLOB,
      allowNull: true,
    },
    { transaction },
  );

  logger.info('Adding `totpEnabled` column to `AppMember` table');
  await queryInterface.addColumn(
    'AppMember',
    'totpEnabled',
    {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    { transaction },
  );
}

/**
 * Summary:
 * - Remove TOTP columns from `AppMember` table.
 *
 * @param transaction Sequelize transaction
 * @param db The Sequelize Database.
 */
export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Removing `totpSecret` column from `AppMember` table');
  await queryInterface.removeColumn('AppMember', 'totpSecret', { transaction });

  logger.info('Removing `totpEnabled` column from `AppMember` table');
  await queryInterface.removeColumn('AppMember', 'totpEnabled', { transaction });
}
