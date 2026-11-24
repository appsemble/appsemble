import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize, type Transaction } from 'sequelize';

export const key = '0.41.9';

export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  logger.info('Add column `username` to table `OrganizationSsoIdentity`');
  await db
    .getQueryInterface()
    .addColumn('OrganizationSsoIdentity', 'username', { type: DataTypes.TEXT }, { transaction });
}

export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  logger.info('Remove column `username` from table `OrganizationSsoIdentity`');
  await db.getQueryInterface().removeColumn('OrganizationSsoIdentity', 'username', { transaction });
}
