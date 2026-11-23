import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize, type Transaction } from 'sequelize';

export const key = '0.41.6';

export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  logger.info('Add organization service accounts');
  await db
    .getQueryInterface()
    .addColumn(
      'OrganizationMember',
      'serviceAccount',
      { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      { transaction },
    );
}

export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  logger.info('Revoke organization service accounts');
  const serviceAccounts = 'SELECT "UserId" FROM "OrganizationMember" WHERE "serviceAccount"';
  await db.query(`UPDATE "User" SET deleted = NOW() WHERE id IN (${serviceAccounts})`, {
    transaction,
  });
  await db.query(`DELETE FROM "OAuth2ClientCredentials" WHERE "UserId" IN (${serviceAccounts})`, {
    transaction,
  });
  await db.query('DELETE FROM "OrganizationMember" WHERE "serviceAccount"', { transaction });
  await db.getQueryInterface().removeColumn('OrganizationMember', 'serviceAccount', {
    transaction,
  });
}
