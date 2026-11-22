import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize, type Transaction } from 'sequelize';

export const key = '0.41.3';

export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  logger.info('Add verified organization single sign-on domains');
  await queryInterface.createTable(
    'OrganizationSsoDomain',
    {
      OrganizationId: {
        type: DataTypes.STRING,
        primaryKey: true,
        references: { model: 'OrganizationSso', key: 'OrganizationId' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      domain: { type: DataTypes.STRING, primaryKey: true },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
    },
    { transaction },
  );
  await queryInterface.addIndex('OrganizationSsoDomain', ['domain'], {
    name: 'OrganizationSsoDomain_domain_idx',
    transaction,
  });
}

export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  logger.info('Remove organization single sign-on domains');
  await db.getQueryInterface().dropTable('OrganizationSsoDomain', { transaction });
}
