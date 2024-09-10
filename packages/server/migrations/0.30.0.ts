import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize, type Transaction } from 'sequelize';

export const key = '0.30.0';

/**
 * Summary:
 * - TODO: Cleanup duplicate users with same email
 * - TODO: Cleanup anonymous users with only a timezone (and name)
 * - TODO: Cleanup demo login users
 * - Add column `id` to `GroupMember` table
 * - Making `AppMember.UserId` nullable
 * - Add unique index `UniqueUserEmail` to column `primaryEmail` on `User` table
 * - TODO: Remove column `UserId` from table `OAuth2AuthorizationCode`
 * - TODO: Add column `AppMemberId` to the `OAuth2AuthorizationCode` table with foreign key
 * constraint
 * - Change column `AppMemberId` to nullable on table `AppOAuth2Authorization`
 * - Remove column `demoLoginUser` from `User` table
 * - Add column `timezone` to the `AppMember` table
 * - Add column `demo` to the `AppMember` table
 * - Add table `AppInvite`
 * - Rename table `Team` to `Group`
 * - Rename table `TeamMember` to `GroupMember`
 * - Rename table `TeamInvite` to `GroupInvite`
 * - Add column `roles` to `Group` table
 * - Remove column `role` from `GroupMember` table
 * - Remove column `role` from `GroupInvite` table
 *
 * @param transaction The sequelize transaction.
 * @param db The sequelize database.
 */
export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  // TODO: make sure to delete duplicate users with same email
  // TODO: make sure to delete users with only a timezone (and name)
  // TODO: cleanup demoLoginUsers

  logger.info('Add column `id` to `GroupMember` table');
  await queryInterface.addColumn(
    'GroupMember',
    'id',
    {
      allowNull: false,
      type: DataTypes.UUID,
      primaryKey: true,
    },
    { transaction },
  );

  // Logger.info('Removing primary key from `GroupMember` table');
  // await queryInterface.removeConstraint('GroupMember', 'GroupMember_pkey', { transaction });

  // logger.info(
  //   'Creating composite primary key on `GroupMember` table for `id`, `GroupId`, `AppMemberId`',
  // );
  // await queryInterface.addConstraint('GroupMember', {
  //   fields: ['id', 'GroupId', 'AppMemberId'],
  //   type: 'primary key',
  //   name: 'GroupMember_pkey',
  //   transaction,
  // });

  logger.info('Making `AppMember.UserId` nullable');
  await queryInterface.changeColumn(
    'AppMember',
    'UserId',
    {
      allowNull: true,
      type: DataTypes.UUID,
    },
    { transaction },
  );

  logger.warn('Add unique index `UniqueUserEmail` to `primaryEmail` column on `User` table');
  logger.warn('');
  await queryInterface.addIndex('User', ['primaryEmail'], {
    unique: true,
    name: 'UniqueUserEmail',
    transaction,
  });

  // TODO: handle existing connections
  logger.info('Remove column `UserId` on `OAuth2AuthorizationCode` table');
  await queryInterface.removeColumn('OAuth2AuthorizationCode', 'UserId', { transaction });
  // TODO: handle existing connections
  logger.info('Add column `AppMemberId` to `OAuth2AuthorizationCode` table');
  await queryInterface.addColumn(
    'OAuth2AuthorizationCode',
    'AppMemberId',
    {
      type: DataTypes.UUID,
      allowNull: true,
      onUpdate: 'cascade',
      onDelete: 'cascade',
      references: {
        key: 'id',
        model: 'AppMember',
      },
    },
    { transaction },
  );

  logger.info('Change column `AppMemberId` to nullable on `AppOAuth2Authorization` table');
  await queryInterface.changeColumn(
    'AppOAuth2Authorization',
    'AppMemberId',
    {
      type: DataTypes.UUID,
      allowNull: true,
      onUpdate: 'cascade',
      onDelete: 'cascade',
      // TODO: fix the following creating new fkeys every time
      // references: {
      //   key: 'id',
      //   model: 'AppMember',
      // },
    },
    { transaction },
  );

  logger.info('Remove column `demoLoginUser` from `User` table');
  await queryInterface.removeColumn('User', 'demoLoginUser', { transaction });

  logger.info('Add column `timezone` to `AppMember` table');
  await queryInterface.addColumn(
    'AppMember',
    'timezone',
    {
      type: DataTypes.STRING,
      allowNull: true,
    },
    { transaction },
  );

  logger.info('Add column `demo` to `AppMember` table');
  await queryInterface.addColumn(
    'AppMember',
    'demo',
    {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    { transaction },
  );

  logger.info('Add table `AppInvite`');
  await queryInterface.createTable(
    'AppInvite',
    {
      email: { type: DataTypes.STRING, primaryKey: true, allowNull: false },
      key: { type: DataTypes.STRING, allowNull: false },
      role: { type: DataTypes.STRING, allowNull: false, defaultValue: 'Member' },
      UserId: {
        type: DataTypes.UUID,
        onDelete: 'cascade',
        onUpdate: 'cascade',
        references: {
          model: 'User',
          key: 'id',
        },
        unique: 'AppInvite_UserId_AppId_key',
      },
      AppId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        onDelete: 'cascade',
        onUpdate: 'cascade',
        references: {
          model: 'App',
          key: 'id',
        },
        unique: 'AppInvite_UserId_AppId_key',
      },
      created: { allowNull: false, type: DataTypes.DATE },
      updated: { allowNull: false, type: DataTypes.DATE },
    },
    { transaction },
  );

  logger.info('Create unique index AppInvite_UserId_AppId_key on AppInvite (UserId, AppId)');
  await queryInterface.addIndex('AppInvite', ['UserId', 'AppId'], {
    name: 'AppInvite_UserId_AppId_key',
    unique: true,
    transaction,
  });

  logger.info('Rename table `Team` to `Group`');
  await queryInterface.renameTable('Team', 'Group', { transaction });

  logger.info('Rename table `TeamMember` to `GroupMember`');
  await queryInterface.renameTable('TeamMember', 'GroupMember', { transaction });

  logger.info('Rename table `TeamInvite` to `GroupInvite`');
  await queryInterface.renameTable('TeamInvite', 'GroupInvite', { transaction });

  logger.info('Add column `roles` to `Group` table');
  await queryInterface.addColumn('Group', 'roles', DataTypes.ARRAY(DataTypes.STRING), {
    transaction,
  });

  logger.info('Remove column `role` from `GroupMember` table');
  await queryInterface.removeColumn('GroupMember', 'role', { transaction });

  logger.info('Remove column `role` from `GroupInvite` table');
  await queryInterface.removeColumn('GroupInvite', 'role', { transaction });
}

/**
 * Summary:
 * - Remove column `id` from `GroupMember` table
 * - Making `AppMember.UserId` non-nullable
 * - Remove unique index `UniqueUserEmail` from column `primaryEmail` on `User` table
 * - TODO: Remove column `AppMemberId` on `OAuth2AuthorizationCode` table
 * - TODO: Add column `UserId` to table `OAuth2AuthorizationCode` with foreign key constraint
 * - Change column `AppMemberId` to non-nullable on table `AppOAuth2Authorization`
 * - Add column `demoLoginUser` to `User` table
 * - Remove column `timezone` from the `AppMember` table
 * - Remove column `demo` from the `AppMember` table
 * - Rename table `Group` to `Team`
 * - Rename table `GroupMember` to `TeamMember`
 * - Rename table `GroupInvite` to `TeamInvite`
 * - Remove column `roles` from `Team` table
 * - Add column `role` to `TeamMember` table
 * - Add column `role` to `TeamInvite` table
 *
 * @param transaction The sequelize transaction.
 * @param db The sequelize database.
 */
export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Remove column `id` from `GroupMember` table');
  await queryInterface.removeColumn('GroupMember', 'id', { transaction });

  logger.warn('Making `AppMember.UserId` non-nullable');
  logger.warn('');
  await queryInterface.changeColumn(
    'AppMember',
    'UserId',
    {
      allowNull: false,
      type: DataTypes.UUID,
    },
    { transaction },
  );

  logger.info('Remove unique index `UniqueUserEmail` from `primaryEmail` column on `User` table');
  await queryInterface.removeIndex('User', 'UniqueUserEmail', { transaction });

  // TODO: handle existing connections
  logger.info('Remove column `AppMemberId` on `OAuth2AuthorizationCode` table');
  await queryInterface.removeColumn('OAuth2AuthorizationCode', 'AppMemberId', { transaction });
  // TODO: handle existing connections
  logger.warn('Add column `UserId` to `OAuth2AuthorizationCode` table with foreign key constraint');
  logger.warn('');
  await queryInterface.addColumn(
    'OAuth2AuthorizationCode',
    'UserId',
    {
      type: DataTypes.UUID,
      allowNull: false,
      onUpdate: 'cascade',
      onDelete: 'cascade',
      references: {
        key: 'id',
        model: 'User',
      },
    },
    { transaction },
  );

  logger.warn('Change column `AppMemberId` to non-nullable on `AppOAuth2Authorization` table');
  logger.warn('');
  await queryInterface.changeColumn(
    'AppOAuth2Authorization',
    'AppMemberId',
    {
      type: DataTypes.UUID,
      allowNull: false,
      onUpdate: 'cascade',
      onDelete: 'cascade',
      // References: {
      //   key: 'id',
      //   model: 'AppMember',
      // },
    },
    { transaction },
  );

  logger.info('Add column `demoLoginUser` to `User` table');
  await queryInterface.addColumn(
    'User',
    'demoLoginUser',
    { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
    { transaction },
  );

  logger.info('Remove column `timezone` on `AppMember` table');
  await queryInterface.removeColumn('AppMember', 'timezone', { transaction });

  logger.info('Remove column `demo` on `AppMember` table');
  await queryInterface.removeColumn('AppMember', 'demo', { transaction });

  logger.info('Dropping table AppInvite');
  await queryInterface.dropTable('AppInvite', { transaction });

  logger.info('Removing unique index AppInvite_UserId_AppId_key from AppInvite (UserId, AppId)');
  await queryInterface.removeIndex('AppInvite', 'AppInvite_UserId_AppId_key', { transaction });

  logger.info('Rename table `Group` to `Team`');
  await queryInterface.renameTable('Group', 'Team', { transaction });

  logger.info('Rename table `GroupMember` to `TeamMember`');
  await queryInterface.renameTable('GroupMember', 'TeamMember', { transaction });

  logger.info('Rename table `GroupInvite` to `TeamInvite`');
  await queryInterface.renameTable('GroupInvite', 'TeamInvite', { transaction });

  logger.info('Remove column `roles` from `Team` table');
  await queryInterface.removeColumn('Team', 'roles', { transaction });

  logger.info('Add column `role` to `GroupMember` table');
  await queryInterface.addColumn(
    'GroupMember',
    'role',
    {
      type: DataTypes.ENUM('Member', 'Manager'),
      allowNull: false,
      defaultValue: 'Member',
    },
    { transaction },
  );

  logger.info('Add column `role` to `GroupInvite` table');
  await queryInterface.addColumn(
    'GroupInvite',
    'role',
    {
      type: DataTypes.ENUM('Member', 'Manager'),
      allowNull: false,
      defaultValue: 'Member',
    },
    { transaction },
  );
}
