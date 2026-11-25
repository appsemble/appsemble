import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize, type Transaction } from 'sequelize';

export const key = '0.41.7';

export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  logger.info('Add column `idToken` to table `OrganizationSsoSession`');
  await db
    .getQueryInterface()
    .addColumn('OrganizationSsoSession', 'idToken', { type: DataTypes.BLOB }, { transaction });
}

export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  logger.info('Remove column `idToken` from table `OrganizationSsoSession`');
  await db.getQueryInterface().removeColumn('OrganizationSsoSession', 'idToken', { transaction });
}
