import { logger } from '@appsemble/node-utils';
import { type Sequelize, type Transaction } from 'sequelize';

export const key = '0.31.1-test.5';

const tables = [
  {
    tableName: 'EmailAuthorization',
    field: 'UserId',
    foreignKeyName: 'EmailAuthorization_UserId_fkey',
    referencedTableName: 'User',
    onDelete: 'no action',
  },
  {
    tableName: 'App',
    field: 'OrganizationId',
    foreignKeyName: 'App_OrganizationId_fkey',
    referencedTableName: 'Organization',
    onDelete: 'no action',
  },
  {
    tableName: 'Asset',
    field: 'ResourceId',
    foreignKeyName: 'Asset_ResourceId_fkey',
    referencedTableName: 'Resource',
    onDelete: 'set null',
  },
];

/**
 * Summary:
 * - Change `EmailAuthorization_UserId_fkey` foreign key constraint to cascade.
 *
 * @param transaction The sequelize transaction.
 * @param db The sequelize database.
 */

export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  for (const { field, foreignKeyName, referencedTableName, tableName } of tables) {
    logger.info(
      `Removing foreign key constraint \`${foreignKeyName}\` from table \`${tableName}\``,
    );
    await queryInterface.removeConstraint(tableName, foreignKeyName, { transaction });

    logger.info(
      `Adding foreign key constraint \`${foreignKeyName}\` to table \`${tableName}\` with cascade`,
    );
    await queryInterface.addConstraint(tableName, {
      fields: [field],
      type: 'foreign key',
      name: foreignKeyName,
      onUpdate: 'cascade',
      onDelete: 'cascade',
      references: {
        table: referencedTableName,
        field: 'id',
      },
      transaction,
    });
  }
}

/**
 * Summary:
 * - Change `EmailAuthorization_UserId_fkey` foreign key constraint to set null.
 *
 * @param transaction The sequelize transaction.
 * @param db The sequelize database.
 */
export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  for (const { field, foreignKeyName, onDelete, referencedTableName, tableName } of tables) {
    logger.info(
      `Removing foreign key constraint \`${foreignKeyName}\` from table \`${tableName}\``,
    );
    await queryInterface.removeConstraint(tableName, foreignKeyName, { transaction });

    logger.info(
      `Adding foreign key constraint \`${foreignKeyName}\` to table \`${tableName}\` without cascade`,
    );
    await queryInterface.addConstraint(tableName, {
      fields: [field],
      type: 'foreign key',
      name: foreignKeyName,
      onUpdate: 'cascade',
      onDelete,
      references: {
        table: referencedTableName,
        field: 'id',
      },
      transaction,
    });
  }
}
