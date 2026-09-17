import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize, type Transaction } from 'sequelize';

export const key = '0.38.2-test.1';

/**
 * Summary:
 * - Add `totpLastCounter` column to `AppMember` table to reject replayed TOTP codes.
 * - Add `totpFailedAttempts` column to `AppMember` table to count consecutive bad TOTP codes.
 * - Add `totpLockedUntil` column to `AppMember` table to throttle TOTP brute forcing.
 * - Add `totpConsumedJti` column to `AppMember` table to make pending TOTP tokens single use.
 *
 * @param transaction Sequelize transaction
 * @param db The Sequelize Database.
 */
export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Adding `totpLastCounter` column to `AppMember` table');
  await queryInterface.addColumn(
    'AppMember',
    'totpLastCounter',
    {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    { transaction },
  );

  logger.info('Adding `totpFailedAttempts` column to `AppMember` table');
  await queryInterface.addColumn(
    'AppMember',
    'totpFailedAttempts',
    {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    { transaction },
  );

  logger.info('Adding `totpLockedUntil` column to `AppMember` table');
  await queryInterface.addColumn(
    'AppMember',
    'totpLockedUntil',
    {
      type: DataTypes.DATE,
      allowNull: true,
    },
    { transaction },
  );

  logger.info('Adding `totpConsumedJti` column to `AppMember` table');
  await queryInterface.addColumn(
    'AppMember',
    'totpConsumedJti',
    {
      type: DataTypes.STRING,
      allowNull: true,
    },
    { transaction },
  );
}

/**
 * Summary:
 * - Remove `totpLastCounter` column from `AppMember` table.
 * - Remove `totpFailedAttempts` column from `AppMember` table.
 * - Remove `totpLockedUntil` column from `AppMember` table.
 * - Remove `totpConsumedJti` column from `AppMember` table.
 *
 * @param transaction Sequelize transaction
 * @param db The Sequelize Database.
 */
export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Removing `totpLastCounter` column from `AppMember` table');
  await queryInterface.removeColumn('AppMember', 'totpLastCounter', { transaction });

  logger.info('Removing `totpFailedAttempts` column from `AppMember` table');
  await queryInterface.removeColumn('AppMember', 'totpFailedAttempts', { transaction });

  logger.info('Removing `totpLockedUntil` column from `AppMember` table');
  await queryInterface.removeColumn('AppMember', 'totpLockedUntil', { transaction });

  logger.info('Removing `totpConsumedJti` column from `AppMember` table');
  await queryInterface.removeColumn('AppMember', 'totpConsumedJti', { transaction });
}
