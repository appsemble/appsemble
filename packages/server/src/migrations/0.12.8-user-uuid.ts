import { DataTypes, QueryTypes } from 'sequelize';
import { v4 } from 'uuid';

import type { Migration } from '../utils/migrate';

export default {
  key: '0.12.8',

  /**
   * Summary:
   * - Drop user constraints
   * - Add new column for user ID
   * - Generate new UUID for each user
   * -
   */
  async up(db) {
    const queryInterface = db.getQueryInterface();

    const users = await db.query<{ id: number }>('SELECT id FROM "User"', {
      raw: true,
      type: QueryTypes.SELECT,
    });

    const tables = [
      { name: 'AppMember', allowNull: true, onDelete: 'cascade' },
      { name: 'AppRating', allowNull: true, onDelete: 'cascade' },
      { name: 'AppSubscription', allowNull: true, onDelete: 'cascade' },
      { name: 'Asset', allowNull: true, onDelete: 'cascade' },
      { name: 'EmailAuthorization', allowNull: true, onDelete: 'cascade' },
      { name: 'Member', allowNull: true, onDelete: 'cascade' },
      { name: 'OAuth2AuthorizationCode', allowNull: true, onDelete: 'cascade' },
      { name: 'OAuth2ClientCredentials', allowNull: true, onDelete: 'cascade' },
      { name: 'OAuthAuthorization', allowNull: true, onDelete: 'cascade' },
      { name: 'Resource', allowNull: true, onDelete: 'cascade' },
      { name: 'OrganizationInvite', allowNull: true, onDelete: 'cascade' },
      { name: 'ResetPasswordToken', allowNull: true, onDelete: 'cascade' },
    ];

    await queryInterface.addColumn('User', 'newId', {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: true,
    });

    const ids = users.map((u) => ({ id: u.id, newId: v4() }));
    await Promise.all(
      ids.map((id) =>
        db.query('UPDATE "User" SET "newId" = ? WHERE id = ?', { replacements: [id.newId, id.id] }),
      ),
    );
    await Promise.all(
      tables.map(async (table) => {
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
          defaultValue: DataTypes.UUIDV4,
          allowNull: table.allowNull,
        });
      }),
    );

    await queryInterface.removeColumn('User', 'id');
    await queryInterface.renameColumn('User', 'newId', 'id');
    await queryInterface.changeColumn('User', 'id', {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true,
      unique: true,
    });

    await Promise.all(
      tables.map((table) =>
        queryInterface.addConstraint(table.name, ['UserId'], {
          type: 'foreign key',
          name: `${table.name}_UserId_fkey`,
          onUpdate: 'cascade',
          onDelete: table.onDelete,
          references: { table: 'User', field: 'id' },
        }),
      ),
    );
  },

  async down(db) {
    const queryInterface = db.getQueryInterface();
    // await queryInterface.removeColumn('BlockVersion', 'icon');
  },
} as Migration;
