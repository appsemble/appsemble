import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize, type Transaction } from 'sequelize';

export const key = '0.32.1-test.9';

/**
 * Summary:
 * - Create table `AppWebhookSecret`
 *
 * @param transaction The sequelize transaction.
 * @param db The sequelize database.
 */

export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  logger.info('Creating table `AppWebhookSecret`');
  await queryInterface.createTable(
    'AppWebhookSecret',
    {
      id: { type: DataTypes.UUID, allowNull: false, primaryKey: true },
      name: { type: DataTypes.STRING(255), allowNull: true },
      secret: { type: DataTypes.BLOB, allowNull: false },
      AppId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'App', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
    },
    { transaction },
  );
}

/**
 * Summary:
 * - Drop table `AppWebhookSecret`
 *
 * @param transaction The sequelize transaction.
 * @param db The sequelize database.
 */

export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Dropping `AppWebhookSecret` table');
  await queryInterface.dropTable('AppWebhookSecret', { transaction });
}
