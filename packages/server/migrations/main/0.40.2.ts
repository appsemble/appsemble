import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize, type Transaction } from 'sequelize';

export const key = '0.40.2';

/**
 * Summary:
 * - Store training completions without a foreign key to the bundled training catalog
 * - Remove the mirrored `Training` table
 *
 * @param transaction The migration transaction.
 * @param db The database connection.
 */
export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Remove the training catalog foreign key');
  await queryInterface.removeConstraint('TrainingCompleted', 'TrainingCompleted_TrainingId_fkey', {
    transaction,
  });

  logger.info('Drop the mirrored `Training` table');
  await queryInterface.dropTable('Training', { transaction });
}

/**
 * Summary:
 * - Restore the `Training` table and its completion foreign key
 *
 * @param transaction The migration transaction.
 * @param db The database connection.
 */
export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Recreate the `Training` table');
  await queryInterface.createTable(
    'Training',
    {
      id: { type: DataTypes.STRING, primaryKey: true },
      created: { allowNull: false, type: DataTypes.DATE },
      updated: { allowNull: false, type: DataTypes.DATE },
    },
    { transaction },
  );

  await db.query(
    `INSERT INTO "Training" (id, created, updated)
     SELECT DISTINCT "TrainingId", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
     FROM "TrainingCompleted"`,
    { transaction },
  );

  logger.info('Restore the training completion foreign key');
  await queryInterface.addConstraint('TrainingCompleted', {
    fields: ['TrainingId'],
    name: 'TrainingCompleted_TrainingId_fkey',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    references: { field: 'id', table: 'Training' },
    transaction,
    type: 'foreign key',
  });
}
