import { randomUUID } from 'crypto';

import { AppsembleError, logger } from '@appsemble/node-utils';
import { DataTypes, QueryTypes, Sequelize } from 'sequelize';

export const key = '0.13.0';

/**
 * Summary:
 * - Drop user foreign key constraints
 * - Add new column for user ID
 * - Generate new UUID for each user
 * - Add a new UUID column in each related table
 * - Update the new UUID column to the newly mapped user IDs
 * - Remove old column in related tables
 * - Rename new column to UserId in related tables
 * - Remove old id column in user table
 * - Rename newId to id
 * - Re-add foreign key constraints in related tables
 *
 * @param db The sequelize Database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  const users = await db.query<{ id: number }>('SELECT id FROM "User"', {
    raw: true,
    type: QueryTypes.SELECT,
  });

  const tables = [
    { name: 'AppMember', allowNull: false, onDelete: 'cascade' },
    { name: 'AppRating', allowNull: false, onDelete: 'cascade' },
    { name: 'AppSubscription', allowNull: true, onDelete: 'set null' },
    { name: 'Asset', allowNull: true, onDelete: 'set null' },
    { name: 'EmailAuthorization', allowNull: false, onDelete: 'cascade' },
    { name: 'Member', allowNull: false, onDelete: 'cascade' },
    { name: 'OAuth2AuthorizationCode', allowNull: false, onDelete: 'cascade' },
    { name: 'OAuth2ClientCredentials', allowNull: false, onDelete: 'cascade' },
    { name: 'OAuthAuthorization', allowNull: true, onDelete: 'set null' },
    { name: 'Resource', allowNull: true, onDelete: 'set null' },
    { name: 'OrganizationInvite', allowNull: true, onDelete: 'set null' },
    { name: 'ResetPasswordToken', allowNull: false, onDelete: 'cascade' },
  ];

  logger.info('Adding column newId');
  await queryInterface.addColumn('User', 'newId', {
    type: DataTypes.UUID,
    allowNull: true,
  });

  logger.info('Generating IDs');
  const ids = users.map((u) => ({ id: u.id, newId: randomUUID() }));
  await Promise.all(
    ids.map((id) =>
      db.query('UPDATE "User" SET "newId" = ? WHERE id = ?', { replacements: [id.newId, id.id] }),
    ),
  );

  for (const table of tables) {
    logger.info(`Updating ${table.name}`);
    await queryInterface.removeConstraint(table.name, `${table.name}_UserId_fkey`);
    await queryInterface.addColumn(table.name, 'NewUserId', {
      type: DataTypes.UUID,
    });
    await Promise.all(
      ids.map((id) =>
        db.query(`UPDATE "${table.name}" SET "NewUserId" = ? WHERE "UserId" = ?`, {
          replacements: [id.newId, id.id],
          type: QueryTypes.UPDATE,
        }),
      ),
    );
    await queryInterface.removeColumn(table.name, 'UserId');
    await queryInterface.renameColumn(table.name, 'NewUserId', 'UserId');
    await queryInterface.changeColumn(table.name, 'UserId', {
      type: DataTypes.UUID,
      allowNull: table.allowNull,
    });
  }

  logger.info('Renaming newId');
  await queryInterface.removeColumn('User', 'id');
  await queryInterface.renameColumn('User', 'newId', 'id');
  await queryInterface.changeColumn('User', 'id', {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    primaryKey: true,
  });

  for (const table of tables) {
    logger.info(`Adding UserId constraint to ${table.name}`);
    await queryInterface.addConstraint(table.name, {
      fields: ['UserId'],
      type: 'foreign key',
      name: `${table.name}_UserId_fkey`,
      onUpdate: 'cascade',
      onDelete: table.onDelete,
      references: { table: 'User', field: 'id' },
    });
  }
}

export function down(): Promise<void> {
  throw new AppsembleError('Due to complexity, down migrations from 0.13.0 are not supported.');
}
