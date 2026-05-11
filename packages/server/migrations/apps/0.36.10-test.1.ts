import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize, type Transaction } from 'sequelize';

export const key = '0.36.10-test.1';

/**
 * Summary:
 * - Create new table `AppMemberAssignedRole`.
 * - Migrate existing `AppMember.role` values into `AppMemberAssignedRole`.
 * - Keep `AppMember.role` as a nullable compatibility shim.
 *
 * @param transaction Sequelize transaction
 * @param db The Sequelize Database.
 */
export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Creating new table `AppMemberAssignedRole`');
  await queryInterface.createTable(
    'AppMemberAssignedRole',
    {
      AppMemberId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'AppMember',
          key: 'id',
        },
        onDelete: 'cascade',
        onUpdate: 'cascade',
        primaryKey: true,
      },
      role: { type: DataTypes.STRING, allowNull: false, primaryKey: true },
      source: { type: DataTypes.STRING, allowNull: false, defaultValue: 'manual' },
      externalGroup: { type: DataTypes.STRING },
      created: { allowNull: false, type: DataTypes.DATE },
      updated: { allowNull: false, type: DataTypes.DATE },
    },
    { transaction },
  );

  logger.info('Creating indexes for `AppMemberAssignedRole`');
  await queryInterface.addIndex('AppMemberAssignedRole', ['role'], { transaction });
  await queryInterface.addIndex('AppMemberAssignedRole', ['source'], { transaction });

  logger.info('Migrating `AppMember.role` data to `AppMemberAssignedRole`');
  await db.query(
    `
      INSERT INTO "AppMemberAssignedRole" ("AppMemberId", role, source, created, updated)
      SELECT id, role, 'manual', created, updated
      FROM "AppMember"
    `,
    { transaction },
  );

  logger.info('Making `AppMember.role` nullable for compatibility');
  await queryInterface.changeColumn(
    'AppMember',
    'role',
    { type: DataTypes.STRING, allowNull: true },
    { transaction },
  );
}

/**
 * Summary:
 * - Migrate one assigned role per member back into `AppMember.role`.
 * - Restore `AppMember.role` as required.
 * - Drop `AppMemberAssignedRole`.
 *
 * @param transaction Sequelize transaction
 * @param db The Sequelize Database.
 */
export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Migrating `AppMemberAssignedRole` data back to `AppMember.role`');
  await db.query(
    `
      UPDATE "AppMember"
      SET role = source.role
      FROM (
        SELECT DISTINCT ON ("AppMemberId") "AppMemberId", role
        FROM "AppMemberAssignedRole"
        ORDER BY "AppMemberId", created ASC, role ASC
      ) AS source
      WHERE "AppMember".id = source."AppMemberId"
    `,
    { transaction },
  );

  logger.info('Making `AppMember.role` required');
  await queryInterface.changeColumn(
    'AppMember',
    'role',
    { type: DataTypes.STRING, allowNull: false },
    { transaction },
  );

  logger.info('Dropping table `AppMemberAssignedRole`');
  await queryInterface.dropTable('AppMemberAssignedRole', { transaction });
}
