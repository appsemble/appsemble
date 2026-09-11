import { logger } from '@appsemble/node-utils';
import { type Sequelize, type Transaction } from 'sequelize';

export const key = '0.37.4';

/**
 * Summary:
 * - Cascade delete `AppEmailQuotaLog` records when deleting an app
 */

export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Cascade delete `AppEmailQuotaLog` records when deleting an app');
  await queryInterface.removeConstraint('AppEmailQuotaLog', 'AppEmailQuotaLog_AppId_fkey', {
    transaction,
  });
  await queryInterface.addConstraint('AppEmailQuotaLog', {
    fields: ['AppId'],
    name: 'AppEmailQuotaLog_AppId_fkey',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    references: { field: 'id', table: 'App' },
    transaction,
    type: 'foreign key',
  });
}

/**
 * Summary:
 * - Preserve `AppEmailQuotaLog` records when deleting an app
 */

export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Preserve `AppEmailQuotaLog` records when deleting an app');
  await queryInterface.removeConstraint('AppEmailQuotaLog', 'AppEmailQuotaLog_AppId_fkey', {
    transaction,
  });
  await queryInterface.addConstraint('AppEmailQuotaLog', {
    fields: ['AppId'],
    name: 'AppEmailQuotaLog_AppId_fkey',
    onDelete: 'NO ACTION',
    onUpdate: 'CASCADE',
    references: { field: 'id', table: 'App' },
    transaction,
    type: 'foreign key',
  });
}
