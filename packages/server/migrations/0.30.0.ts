import { isDeepStrictEqual } from 'node:util';

import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize, type Transaction } from 'sequelize';
import { type Document, Scalar, YAMLMap, YAMLSeq } from 'yaml';

import { type Patch, type Path } from '../commands/migrateAppDefinitions.js';

export const key = '0.30.0';

/**
 * Summary:
 * - TODO: Cleanup duplicate users with same email
 * - TODO: Cleanup anonymous users with only a timezone (and name)
 * - TODO: Cleanup demo login users
 * - Make `AppSamlSecret.emailAttribute` non-nullable with default
 * - Add column `emailVerifiedAttribute` to `AppSamlSecret` table
 * - Make `AppMember.UserId` nullable
 * - Add unique index `UniqueUserEmail` to column `primaryEmail` on `User` table
 * - TODO: Remove column `UserId` from table `OAuth2AuthorizationCode`
 * - TODO: Add column `AppMemberId` to the `OAuth2AuthorizationCode` table with foreign key
 * constraint
 * - Change column `AppMemberId` to nullable on table `AppOAuth2Authorization`
 * - Add column `email` to  `AppOAuth2Authorization` table
 * - Add column `emailVerified` to  `AppOAuth2Authorization` table
 * - Add column `email` to `AppSamlAuthorization` table
 * - Add column `emailVerified` to `AppSamlAuthorization` table
 * - Remove column `demoLoginUser` from `User` table
 * - Add column `timezone` to the `AppMember` table
 * - Add column `demo` to the `AppMember` table
 * - Add table `AppInvite`
 * - Create unique index AppInvite_UserId_AppId_key on AppInvite (UserId, AppId)
 * - Create table `Group`
 * - Copying records from table `Team` to `Group`
 * - Dropping table `Team`
 * - Create table `GroupMember`
 * - Copying records from table `TeamMember` to `GroupMember`
 * - Dropping table `TeamMember`
 * - Drop enum `enum_TeamMember_role`
 * - Create table `GroupInvite`
 * - Copying records from table `TeamInvite` to `GroupInvite`
 * - Dropping table `TeamInvite`
 * - Drop enum `enum_TeamInvite_role`
 * - ALTER TYPE `enum_OrganizationInvite_role` ADD VALUE 'AppCollectionManager' BEFORE 'AppEditor'
 * - ALTER TYPE `enum_OrganizationMember_role` ADD VALUE 'AppCollectionManager' BEFORE 'AppEditor'
 * - ALTER TYPE `enum_OrganizationInvite_role` ADD VALUE 'AppContentsExplorer' BEFORE 'AppEditor'
 * - ALTER TYPE `enum_OrganizationMember_role` ADD VALUE 'AppContentsExplorer' BEFORE 'AppEditor'
 * - ALTER TYPE `enum_OrganizationInvite_role` RENAME VALUE 'AppEditor' TO 'AppContentsManager'
 * - ALTER TYPE `enum_OrganizationMember_role` RENAME VALUE 'AppEditor' TO 'AppContentsManager'
 * - ALTER TYPE `enum_OrganizationInvite_role` ADD VALUE 'AppGroupManager' AFTER 'AccountManager'
 * - ALTER TYPE `enum_OrganizationMember_role` ADD VALUE 'AppGroupManager' AFTER 'AccountManager'
 * - ALTER TYPE `enum_OrganizationInvite_role` ADD VALUE 'AppGroupMembersManager' AFTER
 * 'AccountManager'
 * - ALTER TYPE `enum_OrganizationMember_role` ADD VALUE 'AppGroupMembersManager' AFTER
 * 'AccountManager'
 * - ALTER TYPE `enum_OrganizationInvite_role` ADD VALUE 'AppManager' AFTER 'AccountManager'
 * - ALTER TYPE `enum_OrganizationMember_role` ADD VALUE 'AppManager' AFTER 'AccountManager'
 * - ALTER TYPE `enum_OrganizationInvite_role` RENAME VALUE 'AccountManager' TO 'AppMemberManager'
 * - ALTER TYPE `enum_OrganizationMember_role` RENAME VALUE 'AccountManager' TO 'AppMemberManager'
 * - ALTER TYPE `enum_OrganizationInvite_role` RENAME VALUE 'Translator' TO 'AppTranslator'
 * - ALTER TYPE `enum_OrganizationMember_role` RENAME VALUE 'Translator' TO 'AppTranslator'
 * - ALTER TYPE `enum_OrganizationInvite_role` ADD VALUE 'BlockManager'
 * - ALTER TYPE `enum_OrganizationMember_role` ADD VALUE 'BlockManager'
 * - Change role APIReader to default value
 * - Remove APIReader from enum `enum_OrganizationInvite_role`
 * - Change role APIReader to default value
 * - Remove APIReader from enum `enum_OrganizationMember_role`
 * - Change role APIUser to default value
 * - Remove APIUser from enum `enum_OrganizationInvite_role`
 * - Change role APIUser to default value
 * - Remove APIUser from enum `enum_OrganizationMember_role`
 * - Add column `GroupId` to `Resource` table
 * - Add column `GroupId` to `Asset` table
 * - Update unique index `UniqueAssetNameIndex` in `Asset` table
 *
 * @param transaction The sequelize transaction.
 * @param db The sequelize database.
 */
export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  // TODO: make sure to delete duplicate users with same email
  // TODO: make sure to delete users with only a timezone (and name)
  // TODO: cleanup demoLoginUsers

  logger.info('Making `AppSamlSecret.emailAttribute` non-nullable with default');
  await queryInterface.changeColumn(
    'AppSamlSecret',
    'emailAttribute',
    {
      allowNull: false,
      type: DataTypes.STRING,
      defaultValue: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress',
    },
    { transaction },
  );

  logger.info('Adding column `emailVerifiedAttribute` to `AppSamlSecret` table');
  await queryInterface.addColumn(
    'AppSamlSecret',
    'emailVerifiedAttribute',
    {
      allowNull: true,
      type: DataTypes.STRING,
    },
    { transaction },
  );

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
      allowNull: false,
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

  // TODO: handle allow null true -> false
  logger.info('Add column `email` to  `AppOAuth2Authorization` table');
  await queryInterface.addColumn(
    'AppOAuth2Authorization',
    'email',
    { type: DataTypes.STRING, allowNull: true },
    { transaction },
  );
  logger.info('Add column `emailVerified` to  `AppOAuth2Authorization` table');
  await queryInterface.addColumn(
    'AppOAuth2Authorization',
    'emailVerified',
    { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    { transaction },
  );

  // TODO: handle allow null true -> false
  logger.info('Add column `email` to `AppSamlAuthorization` table');
  await queryInterface.addColumn(
    'AppSamlAuthorization',
    'email',
    { type: DataTypes.STRING, allowNull: true },
    { transaction },
  );
  logger.info('Add column `emailVerified` to `AppSamlAuthorization` table');
  await queryInterface.addColumn(
    'AppSamlAuthorization',
    'emailVerified',
    { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
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
        primaryKey: true,
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

  logger.info('Create table `Group`');
  await queryInterface.createTable(
    'Group',
    {
      id: { autoIncrement: true, type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
      name: { type: DataTypes.STRING(255), allowNull: false },
      AppId: {
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'App', key: 'id' },
      },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
      annotations: { type: DataTypes.JSON, allowNull: true },
      demo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    },
    { transaction },
  );

  // TODO: test against prod data
  logger.warn('Copying records from table `Team` to `Group`');
  logger.warn('The following query might be slow depending on the amount of records present.');
  await queryInterface.sequelize.query('INSERT INTO "Group" SELECT * FROM "Team";', {
    transaction,
  });

  logger.warn('Dropping table `Team`');
  await queryInterface.dropTable('Team', { force: true, transaction });

  logger.info('Create table `GroupMember`');
  await queryInterface.createTable(
    'GroupMember',
    {
      id: { type: DataTypes.UUID, allowNull: false, primaryKey: true },
      role: { type: DataTypes.STRING, allowNull: false, defaultValue: 'Member' },
      GroupId: {
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: { model: 'Group', key: 'id' },
      },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
      AppMemberId: {
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        references: { model: 'AppMember', key: 'id' },
      },
    },
    { transaction },
  );

  // TODO: test against prod data
  logger.warn('Copying records from table `TeamMember` to `GroupMember`');
  logger.warn('The following query might be slow depending on the amount of records present.');
  logger.warn('The following query uses `gen_random_uuid()` to generate UUIDv4s.');
  await queryInterface.sequelize.query(
    `INSERT INTO "GroupMember" (id, role, "GroupId", created, updated, "AppMemberId")
      SELECT
        gen_random_uuid(),
        CASE role
          WHEN 'member'::"enum_TeamMember_role" THEN 'Member'
          WHEN 'manager'::"enum_TeamMember_role" THEN 'GroupsManager'
        END as role,
        "TeamId" AS "GroupId", created, updated, "AppMemberId"
      FROM "TeamMember";`,
    { transaction },
  );

  logger.warn('Dropping table `TeamMember`');
  await queryInterface.dropTable('TeamMember', { force: true, transaction });

  logger.info('Drop enum `enum_TeamMember_role`');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_TeamMember_role"', {
    transaction,
  });

  logger.info('Create table `GroupInvite`');
  await queryInterface.createTable(
    'GroupInvite',
    {
      GroupId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: { model: 'Group', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      email: { type: DataTypes.STRING(255), allowNull: false, primaryKey: true },
      role: { type: DataTypes.STRING(255), allowNull: false, defaultValue: 'Member' },
      key: { type: DataTypes.STRING(255), allowNull: false },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
    },
    { transaction },
  );

  // TODO: test against prod data
  logger.warn('Copying records from table `TeamInvite` to `GroupInvite`');
  logger.warn('The following query might be slow depending on the amount of records present.');
  await queryInterface.sequelize.query(
    `
    INSERT INTO "GroupInvite" ("GroupId", email, role, key, created, updated)
      SELECT "TeamId" AS "GroupId", email,
        CASE role
          WHEN 'member'::"enum_TeamInvite_role" THEN 'Member'
          WHEN 'manager'::"enum_TeamInvite_role" THEN 'GroupsManager'
        END as role,
        key, created, updated
      FROM "TeamInvite";`,
    { transaction },
  );

  logger.warn('Dropping table `TeamInvite`');
  await queryInterface.dropTable('TeamInvite', { force: true, transaction });

  logger.info('Drop enum `enum_TeamInvite_role`');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_TeamInvite_role"', {
    transaction,
  });

  const organizationRoleActions = [
    "ADD VALUE 'AppCollectionManager' BEFORE 'AppEditor'",
    "ADD VALUE 'AppContentsExplorer' BEFORE 'AppEditor'",
    "RENAME VALUE 'AppEditor' TO 'AppContentsManager'",
    "ADD VALUE 'AppGroupManager' AFTER 'AccountManager'",
    "ADD VALUE 'AppGroupMembersManager' AFTER 'AccountManager'",
    "ADD VALUE 'AppManager' AFTER 'AccountManager'",
    "RENAME VALUE 'AccountManager' TO 'AppMemberManager'",
    "RENAME VALUE 'Translator' TO 'AppTranslator'",
    "ADD VALUE 'BlockManager'",
  ] satisfies string[];
  for (const action of organizationRoleActions) {
    logger.info(`ALTER TYPE \`enum_OrganizationInvite_role\` ${action}`);
    await queryInterface.sequelize.query(`ALTER TYPE "enum_OrganizationInvite_role" ${action};`, {
      transaction,
    });
    logger.info(`ALTER TYPE \`enum_OrganizationMember_role\` ${action}`);
    await queryInterface.sequelize.query(`ALTER TYPE "enum_OrganizationMember_role" ${action};`, {
      transaction,
    });
  }

  const organizationRolesToDrop = [
    'APIReader',
    'APIUser',
    // 'AccountManager',
    // 'AppEditor',
    // 'Translator',
  ] satisfies string[];
  for (const attribute of organizationRolesToDrop) {
    logger.warn(`Change role ${attribute} to default value`);
    logger.info(`Remove ${attribute} from enum \`enum_OrganizationInvite_role\``);
    await queryInterface.sequelize.query(
      `
    UPDATE "OrganizationMember" SET role = 'Member' WHERE role = '${attribute}';
    DELETE FROM pg_enum WHERE enumlabel = '${attribute}' AND enumtypid = (
      SELECT oid FROM pg_type WHERE typname = 'enum_OrganizationInvite_role'
    );`,
      { transaction },
    );
    logger.warn(`Change role ${attribute} to default value`);
    logger.info(`Remove ${attribute} from enum \`enum_OrganizationMember_role\``);
    await queryInterface.sequelize.query(
      `
    UPDATE "OrganizationMember" SET role = 'Member' WHERE role = '${attribute}';
    DELETE FROM pg_enum WHERE enumlabel = '${attribute}' AND enumtypid = (
      SELECT oid FROM pg_type WHERE typname = 'enum_OrganizationMember_role'
    );`,
      { transaction },
    );
  }

  logger.info('Add column `GroupId` to `Resource` table');
  await queryInterface.addColumn(
    'Resource',
    'GroupId',
    {
      type: DataTypes.INTEGER,
      allowNull: true,
      onUpdate: 'cascade',
      onDelete: 'cascade',
      references: {
        key: 'id',
        model: 'Group',
      },
    },
    { transaction },
  );

  logger.info('Add column `GroupId` to `Asset` table');
  await queryInterface.addColumn(
    'Asset',
    'GroupId',
    {
      type: DataTypes.INTEGER,
      allowNull: true,
      onUpdate: 'cascade',
      onDelete: 'cascade',
      references: {
        key: 'id',
        model: 'Group',
      },
    },
    { transaction },
  );

  logger.info('Remove index `UniqueAssetNameIndex` from `Asset` table');
  await queryInterface.removeIndex('Asset', 'UniqueAssetNameIndex', { transaction });

  logger.info('Add index `UniqueAssetNameIndex` to `Asset` table');
  await queryInterface.addIndex('Asset', ['name', 'ephemeral', 'AppId', 'GroupId'], {
    unique: true,
    name: 'UniqueAssetNameIndex',
    transaction,
  });
}

/**
 * Summary:
 * - Make `AppSamlSecret.emailAttribute` nullable
 * - Remove column `emailVerifiedAttribute` from `AppSamlSecret` table
 * - Make `AppMember.UserId` non-nullable
 * - Remove unique index `UniqueUserEmail` from column `primaryEmail` on `User` table
 * - TODO: Remove column `AppMemberId` on `OAuth2AuthorizationCode` table
 * - TODO: Add column `UserId` to table `OAuth2AuthorizationCode` with foreign key constraint
 * - Change column `AppMemberId` to non-nullable on table `AppOAuth2Authorization`
 * - Remove column `email` from  `AppOAuth2Authorization` table
 * - Remove column `emailVerified` from  `AppOAuth2Authorization` table
 * - Remove column `email` from `AppSamlAuthorization` table
 * - Remove column `emailVerified` from `AppSamlAuthorization` table
 * - Add column `demoLoginUser` to `User` table
 * - Remove column `timezone` from the `AppMember` table
 * - Remove column `demo` from the `AppMember` table
 * - Dropping table `AppInvite`
 * - Removing unique index `AppInvite_UserId_AppId_key` from `AppInvite` (UserId, AppId)
 * - Create table `Team`
 * - Removing column `demo` from `Group` table
 * - Copying records from table `Group` to `Team`
 * - Dropping table `Group`
 * - Create table `TeamMember`
 * - Copying records from table `GroupMember` to `TeamMember`
 * - Dropping table `GroupMember`
 * - Create table `TeamInvite`
 * - Copying records from table `GroupInvite` to `TeamInvite`
 * - Dropping table `GroupInvite`
 * - ALTER TYPE `enum_OrganizationInvite_role` ADD VALUE 'APIReader'
 * - ALTER TYPE `enum_OrganizationMember_role` ADD VALUE 'APIReader'
 * - ALTER TYPE `enum_OrganizationInvite_role` ADD VALUE 'APIUser'
 * - ALTER TYPE `enum_OrganizationMember_role` ADD VALUE 'APIUser'
 * - ALTER TYPE `enum_OrganizationInvite_role` RENAME VALUE 'AppContentsManager' TO 'AppEditor'
 * - ALTER TYPE `enum_OrganizationMember_role` RENAME VALUE 'AppContentsManager' TO 'AppEditor'
 * - ALTER TYPE `enum_OrganizationInvite_role` RENAME VALUE 'AppMemberManager' TO 'AccountManager'
 * - ALTER TYPE `enum_OrganizationMember_role` RENAME VALUE 'AppMemberManager' TO 'AccountManager'
 * - ALTER TYPE `enum_OrganizationInvite_role` RENAME VALUE 'AppTranslator' TO 'Translator'
 * - ALTER TYPE `enum_OrganizationMember_role` RENAME VALUE 'AppTranslator' TO 'Translator'
 * - Change role AppCollectionManager to default value
 * - Remove AppCollectionManager from enum `enum_OrganizationInvite_role`
 * - Change role AppCollectionManager to default value
 * - Remove AppCollectionManager from enum `enum_OrganizationMember_role`
 * - Change role AppContentsExplorer to default value
 * - Remove AppContentsExplorer from enum `enum_OrganizationInvite_role`
 * - Change role AppContentsExplorer to default value
 * - Remove AppContentsExplorer from enum `enum_OrganizationMember_role`
 * - Change role AppGroupManager to default value
 * - Remove AppGroupManager from enum `enum_OrganizationInvite_role`
 * - Change role AppGroupManager to default value
 * - Remove AppGroupManager from enum `enum_OrganizationMember_role`
 * - Change role AppGroupMembersManager to default value
 * - Remove AppGroupMembersManager from enum `enum_OrganizationInvite_role`
 * - Change role AppGroupMembersManager to default value
 * - Remove AppGroupMembersManager from enum `enum_OrganizationMember_role`
 * - Change role AppManager to default value
 * - Remove AppManager from enum `enum_OrganizationInvite_role`
 * - Change role AppManager to default value
 * - Remove AppManager from enum `enum_OrganizationMember_role`
 * - Change role BlockManager to default value
 * - Remove BlockManager from enum `enum_OrganizationInvite_role`
 * - Change role BlockManager to default value
 * - Remove BlockManager from enum `enum_OrganizationMember_role`
 * - Remove column `GroupId` from `Resource` table
 * - Remove column `GroupId` from `Asset` table
 * - Update unique index `UniqueAssetNameIndex` in `Asset` table
 *
 * @param transaction The sequelize transaction.
 * @param db The sequelize database.
 */
export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Making `AppSamlSecret.emailAttribute` nullable');
  await queryInterface.changeColumn(
    'AppSamlSecret',
    'emailAttribute',
    {
      allowNull: true,
      type: DataTypes.STRING,
    },
    { transaction },
  );

  logger.info('Removing column `emailVerifiedAttribute` from `AppSamlSecret` table');
  await queryInterface.removeColumn('AppSamlSecret', 'emailVerifiedAttribute', {
    transaction,
  });

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

  logger.info('Remove column `email` from  `AppOAuth2Authorization` table');
  await queryInterface.removeColumn('AppOAuth2Authorization', 'email', { transaction });
  logger.info('Remove column `emailVerified` from  `AppOAuth2Authorization` table');
  await queryInterface.removeColumn('AppOAuth2Authorization', 'emailVerified', { transaction });

  logger.info('Remove column `email` from `AppSamlAuthorization` table');
  await queryInterface.removeColumn('AppSamlAuthorization', 'email', { transaction });
  logger.info('Remove column `emailVerified` from `AppSamlAuthorization` table');
  await queryInterface.removeColumn('AppSamlAuthorization', 'emailVerified', { transaction });

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

  logger.info('Dropping table `AppInvite`');
  await queryInterface.dropTable('AppInvite', { transaction });

  logger.info(
    'Removing unique index `AppInvite_UserId_AppId_key` from `AppInvite` (UserId, AppId)',
  );
  await queryInterface.removeIndex('AppInvite', 'AppInvite_UserId_AppId_key', { transaction });

  logger.info('Create table `Team`');
  await queryInterface.createTable(
    'Team',
    {
      id: { autoIncrement: true, type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
      name: { type: DataTypes.STRING(255), allowNull: false },
      AppId: {
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'App', key: 'id' },
      },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
      annotations: { type: DataTypes.JSON, allowNull: true },
    },
    { transaction },
  );

  logger.info('Remove column `demo` from `Group` table');
  await queryInterface.removeColumn('Group', 'demo');

  // TODO: test against prod data
  logger.warn('Copying records from table `Group` to `Team`');
  logger.warn('The following query might be slow depending on the amount of records present.');
  await queryInterface.sequelize.query('INSERT INTO "Team" SELECT * FROM "Group";', {
    transaction,
  });

  logger.warn('Dropping table `Group`');
  await queryInterface.dropTable('Group', { force: true, transaction });

  logger.info('Create table `TeamMember`');
  await queryInterface.createTable(
    'TeamMember',
    {
      role: { type: DataTypes.ENUM('member', 'manager'), allowNull: false, defaultValue: 'member' },
      TeamId: {
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: { model: 'Team', key: 'id' },
      },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
      AppMemberId: {
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        references: { model: 'AppMember', key: 'id' },
      },
    },
    { transaction },
  );

  // TODO: test against prod data
  logger.warn('Copying records from table `GroupMember` to `TeamMember`');
  logger.warn('The following query might be slow depending on the amount of records present.');
  await queryInterface.sequelize.query(
    `INSERT INTO "TeamMember" (role, "TeamId", created, updated, "AppMemberId")
      SELECT
        CASE role
          WHEN 'Member' THEN 'member'::"enum_TeamMember_role"
          WHEN 'GroupsManager' THEN 'manager'::"enum_TeamMember_role"
          ELSE 'member'::"enum_TeamMember_role"
        END as role,
        "GroupId" AS "TeamId", created, updated, "AppMemberId"
      FROM "GroupMember";`,
    { transaction },
  );

  logger.warn('Dropping table `GroupMember`');
  await queryInterface.dropTable('GroupMember', { force: true, transaction });

  logger.info('Create table `TeamInvite`');
  await queryInterface.createTable(
    'TeamInvite',
    {
      TeamId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: { model: 'Team', key: 'id' },
        onUpdate: 'CASCADE',
      },
      email: { type: DataTypes.STRING(255), allowNull: false, primaryKey: true },
      role: { type: DataTypes.ENUM('member', 'manager'), allowNull: false, defaultValue: 'member' },
      key: { type: DataTypes.STRING(255), allowNull: false },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
    },
    { transaction },
  );

  // TODO: test against prod data
  logger.warn('Copying records from table `GroupInvite` to `TeamInvite`');
  logger.warn('The following query might be slow depending on the amount of records present.');
  await queryInterface.sequelize.query(
    `
    INSERT INTO "TeamInvite" ("TeamId", email, role, key, created, updated)
      SELECT "GroupId" AS "TeamId", email,
        CASE role
          WHEN 'Member' THEN 'member'::"enum_TeamInvite_role"
          WHEN 'GroupsManager' THEN 'manager'::"enum_TeamInvite_role"
          ELSE 'member'::"enum_TeamInvite_role"
        END as role,
        key, created, updated
      FROM "GroupInvite";`,
    { transaction },
  );

  logger.warn('Dropping table `GroupInvite`');
  await queryInterface.dropTable('GroupInvite', { force: true, transaction });

  const organizationRoleActions = [
    "ADD VALUE 'APIReader'",
    "ADD VALUE 'APIUser'",
    "RENAME VALUE 'AppContentsManager' TO 'AppEditor'",
    "RENAME VALUE 'AppMemberManager' TO 'AccountManager'",
    "RENAME VALUE 'AppTranslator' TO 'Translator'",
  ] satisfies string[];
  for (const action of organizationRoleActions) {
    logger.info(`ALTER TYPE \`enum_OrganizationInvite_role\` ${action}`);
    await queryInterface.sequelize.query(`ALTER TYPE "enum_OrganizationInvite_role" ${action};`, {
      transaction,
    });
    logger.info(`ALTER TYPE \`enum_OrganizationMember_role\` ${action}`);
    await queryInterface.sequelize.query(`ALTER TYPE "enum_OrganizationMember_role" ${action};`, {
      transaction,
    });
  }

  const organizationRolesToDrop = [
    'AppCollectionManager',
    'AppContentsExplorer',
    'AppGroupManager',
    'AppGroupMembersManager',
    'AppManager',
    'BlockManager',
  ] satisfies string[];
  for (const attribute of organizationRolesToDrop) {
    logger.warn(`Change role ${attribute} to default value`);
    logger.info(`Remove ${attribute} from enum \`enum_OrganizationInvite_role\``);
    await queryInterface.sequelize.query(
      `
    UPDATE "OrganizationMember" SET role = 'Member' WHERE role = '${attribute}';
    DELETE FROM pg_enum WHERE enumlabel = '${attribute}' AND enumtypid = (
      SELECT oid FROM pg_type WHERE typname = 'enum_OrganizationInvite_role'
    );`,
      { transaction },
    );
    logger.warn(`Change role ${attribute} to default value`);
    logger.info(`Remove ${attribute} from enum \`enum_OrganizationMember_role\``);
    await queryInterface.sequelize.query(
      `
    UPDATE "OrganizationMember" SET role = 'Member' WHERE role = '${attribute}';
    DELETE FROM pg_enum WHERE enumlabel = '${attribute}' AND enumtypid = (
      SELECT oid FROM pg_type WHERE typname = 'enum_OrganizationMember_role'
    );`,
      { transaction },
    );
  }

  logger.info('Remove column `GroupId` from `Resource` table');
  await queryInterface.removeColumn('Resource', 'GroupId', { transaction });

  logger.info('Remove column `GroupId` from `Asset` table');
  await queryInterface.removeColumn('Asset', 'GroupId', { transaction });

  logger.info('Remove index `UniqueAssetNameIndex` from `Asset` table');
  await queryInterface.removeIndex('Asset', 'UniqueAssetNameIndex', { transaction });

  logger.info('Add index `UniqueAssetNameIndex` to `Asset` table');
  await queryInterface.addIndex('Asset', ['name', 'ephemeral', 'AppId'], {
    unique: true,
    name: 'UniqueAssetNameIndex',
    transaction,
  });
}

const resourceActionPattern = /create|update|patch|query|get|delete|count/;

function addGuest(document: Document): void {
  document.addIn(['security', 'guest', 'permissions'], new YAMLSeq());
}

function handlePermission(
  document: Document,
  resource: string,
  action: string,
  role: string,
  view?: string,
): void {
  if (!document.hasIn(['security', 'roles']) && !document.hasIn(['security', 'guest'])) {
    return;
  }

  const has = (path: Path, permission: string): boolean =>
    (document.getIn(path) as YAMLSeq<string>).items.includes(permission);

  // Consider excluding own:create for $author without a create action on the resource
  const base = [
    '$resource',
    resource,
    role === '$author' && 'own',
    action === 'count' ? 'query' : action,
  ]
    .filter(Boolean)
    .join(':');
  const permission = [base, view].filter(Boolean).join(':');

  const helper = (path: Path): void => {
    if (!has(path, permission)) {
      if (view) {
        const sequence = document.getIn(path) as YAMLSeq;
        const index = sequence.items.indexOf(base);
        document.deleteIn([...path, index]);
      }
      document.addIn(path, permission);
    }
  };

  if (role === '$public') {
    const roles = (
      document.getIn(['security', 'roles']) as YAMLMap<Scalar<string>, unknown>
    ).items.map((pair) => pair.key.value);
    for (const r of roles) {
      helper(['security', 'roles', r, 'permissions']);
    }
    helper(['security', 'guest', 'permissions']);
  } else if (role === '$guest') {
    helper(['security', 'guest', 'permissions']);
  } else if (role === '$author') {
    const roles = (
      document.getIn(['security', 'roles']) as YAMLMap<Scalar<string>, unknown>
    ).items.map((pair) => pair.key.value);
    for (const r of roles) {
      helper(['security', 'roles', r, 'permissions']);
    }
  } else {
    helper(['security', 'roles', role, 'permissions']);
  }
}

export const appPatches: Patch[] = [
  {
    // TODO: test
    message: 'Replace `remap` with `remapBefore`.',
    path: ['*', 'actions', /.*/, /^remap$/],
    delete: true,
    patches: [
      (document, transaction, stepsList) => {
        for (const steps of stepsList) {
          document.addIn(steps.slice(0, -1), {
            key: 'remapBefore',
            value: document.getIn(steps),
          });
        }
      },
    ],
  },
  {
    // TODO: test
    message: 'Replace `hideFromMenu` with `hideNavTitle`.',
    path: ['pages', '*', 'name', '<', /^hideFromMenu$/],
    delete: true,
    patches: [
      (document, transaction, stepsList) => {
        for (const steps of stepsList) {
          document.addIn(steps.slice(0, -2), { key: 'hideNavTitle', value: document.getIn(steps) });
        }
      },
    ],
  },
  {
    message: 'Replace `users` property to `members`.',
    path: ['users'],
    delete: true,
    patches: [
      (document) => {
        document.set('members', document.get('users'));
      },
    ],
  },
  {
    message: 'Rename user actions to app.member actions.',
    // Cannot handle `user.update` changed to `app.member.current.patch`,
    // `app.member.role.update`, and `app.member.properties.patch`
    path: ['*', 'type', /user\.register|login|logout|query|remove/, '<'],
    value(path: Path, transaction: Transaction, steps: Path) {
      if ((steps.at(-1) as string).split('.')[1] === 'remove') {
        return 'app.member.delete';
      }
      return (steps.at(-1) as string).replace('user.', 'app.member.');
    },
  },
  {
    // TODO: test
    // Cannot handle `team.join` no replacement present.
    message: 'Rename team actions to group.member actions.',
    path: ['*', 'actions', /.*/, 'type', /team\.invite|list|members/, '<'],
    value(path: Path, transaction: Transaction, steps: Path) {
      const teamActionSuffix = (steps.at(-1) as string).split('.')[1];
      if (teamActionSuffix === 'invite') {
        return 'group.member.invite';
      }
      if (teamActionSuffix === 'list') {
        return 'group.query';
      }
      if (teamActionSuffix === 'members') {
        return 'group.member.query';
      }
    },
  },
  // TODO: remove teams from security def
  {
    // Teams:
    // join: invite
    // create:
    //   - Reader
    // invite:
    //   - $team:member
    message: 'test',
    path: [],
    patches: [
      (document, transaction, stepsList) => {
        if (document.has('security')) {
          return;
        }
        // Reverse to make sure the roles are deleted in the right order
        for (const steps of stepsList.reverse()) {
          document.deleteIn(steps.slice(0, -1));
        }
      },
    ],
  },
  // Security.default.policy
  // everyone,organization
  {
    message: 'Change',
    path: [],
  },
  {
    message: 'Delete `roles` property.',
    path: ['roles'],
    delete: true,
  },
  {
    message: 'Delete `method` property on resource actions.',
    path: ['*', 'actions', '*', 'type', /^resource\..*/, '<', '<', 'method'],
    delete: true,
  },
  {
    message: 'Add `permissions` to roles.',
    path: ['security', 'roles', /.*/],
    value() {
      return { key: 'permissions', value: new YAMLSeq() };
    },
    add: true,
  },
  {
    message: 'Replace `$none` with `$guest` and add guest to security.',
    path: ['*', 'roles', /\d+/, '$none', '<'],
    value: '$guest',
    patches: [addGuest],
  },
  {
    message: 'Add guest to security if missing when $public is used in resources.',
    path: ['resources', '*', 'roles', /\d+/, '$public', '<'],
    patches: [
      (document, transaction, stepsList) => {
        if (!document.has('security') || document.hasIn(['security', 'guest'])) {
          return;
        }
        if (
          stepsList.some((s) => s[0] === 'resources' && s[2] === 'roles' && s[4] === '$public') ||
          stepsList.some(
            (s) =>
              s[0] === 'resources' &&
              resourceActionPattern.test(s[2] as string) &&
              s[3] === 'roles' &&
              s[5] === '$public',
          ) ||
          stepsList.some(
            (s) =>
              s[0] === 'resources' && s[2] === 'views' && s[4] === 'roles' && s[6] === '$public',
          )
        ) {
          addGuest(document);
        }
      },
    ],
  },
  // TODO fix
  {
    // TODO: write new roles to security def inherit predefined roles
    // and update db group member records with new roles
    message: 'Add roles `Member` and `GroupsManager` to security.roles if used.',
    path: ['*', 'roles', /\d+/, /\$team:member|\$team:manager/, '<'],
    value(path: Path, t: Transaction, steps: Path) {
      if (steps.at(-1) === '$team:manager') {
        return 'GroupsManager';
      }
      return 'Member';
    },
    patches: [
      (document, t, stepsList) => {
        if (stepsList.some((s) => s.at(-1) === '$team:manager')) {
          document.addIn(['security', 'roles'], {
            key: new Scalar('GroupsManager'),
            value: new YAMLMap(),
          });
          document.addIn(['security', 'roles', 'GroupsManager'], {
            key: 'permissions',
            value: new YAMLSeq(),
          });
        }
        if (stepsList.some((s) => s.at(-1) === '$team:member')) {
          document.addIn(['security', 'roles'], {
            key: new Scalar('Member'),
            value: new YAMLMap(),
          });
          document.addIn(['security', 'roles', 'Member'], {
            key: 'permissions',
            value: new YAMLSeq(),
          });
        }
      },
    ],
  },
  {
    // TODO: check presedence in prod
    message: 'Move resource roles to role permissions.',
    path: ['resources', '*', 'roles', /.*/, '<'],
    patches: [
      // Handles top level resource roles
      (document, transaction, stepsList) => {
        const pathsToDelete: Path[] = [];

        const roles = stepsList.filter((s) => s.length === 4);
        for (const steps of roles) {
          const role = document.getIn(steps) as string;
          const resource = steps[1] as string;

          const actions = new Set(
            stepsList
              .filter(
                (s) =>
                  s.length === 5 && s[1] === resource && resourceActionPattern.test(s[2] as string),
              )
              .map((s) => s[2]),
          );

          for (const action of [
            'create',
            'update',
            'patch',
            'query',
            'get',
            'delete',
            'count',
          ].filter((a) => !actions.has(a))) {
            handlePermission(document, resource, action, role);
          }

          const root = steps.slice(0, -1);
          if (!pathsToDelete.some((v) => isDeepStrictEqual(v, root))) {
            pathsToDelete.push(root);
          }
        }

        for (const path of pathsToDelete) {
          document.deleteIn(path);
        }
      },
      // Handles resource action roles
      // TODO: check if the action properties are removed... in regards to resource hooks
      (document, transaction, stepsList) => {
        const pathsToDelete: Path[] = [];

        const actions = stepsList.filter(
          (s) => s.length === 5 && resourceActionPattern.test(s[2] as string),
        );
        for (const steps of actions) {
          const role = document.getIn(steps) as string;
          const resource = steps[1] as string;
          const action = steps[2] as string;

          handlePermission(document, resource, action, role);

          const root = steps.slice(0, -2);
          if (!pathsToDelete.some((v) => isDeepStrictEqual(v, root))) {
            pathsToDelete.push(root);
          }
        }

        for (const path of pathsToDelete) {
          document.deleteIn(path);
        }
      },
      // Handles resource view roles
      (document, transaction, stepsList) => {
        const pathsToDelete: Path[] = [];

        const views = stepsList.filter((s) => s.length === 6 && s[2] === 'views');
        for (const steps of views) {
          const role = document.getIn(steps) as string;
          const resource = steps[1] as string;
          const view = steps[3] as string;

          for (const action of ['query', 'get']) {
            handlePermission(document, resource, action, role, view);
          }

          const root = steps.slice(0, -3);
          if (!pathsToDelete.some((v) => isDeepStrictEqual(v, root))) {
            pathsToDelete.push(root);
          }
        }

        for (const path of pathsToDelete) {
          document.deleteIn(path);
        }
      },
      // TODO: combine resource permissions
      // (document, transaction, steps) => {
      //   const resources = steps
      //     .map((s) => s[1])
      //     .filter((value, index, self) => self.indexOf(value) === index);
      //   const roles = (document.getIn(['security', 'roles']) as YAMLMap).items.map(
      //     (pair) => (pair.key as Scalar).value,
      //   );

      //   for (const role of roles) {
      //     const permissions = document.getIn(['security', 'roles', role, 'permissions'])
      // as YAMLSeq;
      //     console.log(permissions.items);
      //   }
      // },
    ],
  },
  {
    // TODO: test
    message: 'Post process away already inherited roles',
    path: ['security', 'roles', /.*/, 'inherits'],
    patches: [
      (document, transaction, stepsList) => {
        for (const steps of stepsList) {
          const base = steps.slice(0, -1);
          const perms = (document.getIn([...base, 'permissions']) as YAMLSeq<string>).items;
          const roles = document.getIn(steps) as YAMLSeq<Scalar<string>>;
          const collected = new Set<string>();

          for (const { value: role } of roles.items) {
            // Permissions here is a list of string literals,
            // because all permission have been added by us in that manner
            const permissions = document.getIn([
              'security',
              'roles',
              role,
              'permissions',
            ]) as YAMLSeq<string>;
            for (const permission of permissions.items) {
              if (perms.includes(permission)) {
                collected.add(permission);
              }
            }
          }

          // Reverse is maybe not enough scaryy...
          for (const permission of [...collected.values()].reverse()) {
            document.deleteIn([
              'security',
              'roles',
              base.at(-1),
              'permissions',
              perms.indexOf(permission),
            ]);
          }
        }
      },
    ],
  },
  {
    // TODO: fix anchor support???
    message: 'Remove `$public`.',
    path: ['*', 'roles', /\d+/, '$public', '<'],
    patches: [
      (document, transaction, stepsList) => {
        const cleanup = (path: Path): void => {
          const roles = path.slice(0, -1);
          // TODO: consider adding $guest if $public was used with other roles
          if (!document.hasIn([...roles, 0])) {
            document.deleteIn(roles);
          }
        };
        for (const steps of stepsList) {
          const path = steps.slice(0, -1);

          const inPage = steps[0] === 'pages' && typeof steps[1] === 'number';
          const inSubPage =
            inPage &&
            ['steps', 'tabs', 'foreach'].includes(steps[2] as string) &&
            typeof steps[3] === 'number';
          const inDynamicTabPage =
            inPage &&
            steps[2] === 'definition' &&
            steps[3] === 'foreach' &&
            typeof steps[4] === 'number';

          const isPageRoles = steps.length === 5 && inPage && steps[2] === 'roles';
          const isPageBlockRoles =
            steps.length === 7 &&
            inPage &&
            steps[2] === 'blocks' &&
            typeof steps[3] === 'number' &&
            steps[4] === 'roles';
          const isSubPageRoles = steps.length === 7 && inSubPage && steps[4] === 'roles';
          const isSubPageBlockRoles =
            steps.length === 9 &&
            inSubPage &&
            steps[4] === 'blocks' &&
            typeof steps[5] === 'number' &&
            steps[6] === 'roles';

          const isDynamicTabPageRoles =
            steps.length === 8 && inDynamicTabPage && steps[5] === 'roles';
          const isDynamicTabPageBlockRoles =
            steps.length === 10 &&
            inDynamicTabPage &&
            steps[5] === 'blocks' &&
            typeof steps[6] === 'number' &&
            steps[7] === 'roles';

          if (
            !(
              isPageRoles ||
              isPageBlockRoles ||
              isSubPageRoles ||
              isSubPageBlockRoles ||
              isDynamicTabPageRoles ||
              isDynamicTabPageBlockRoles
            )
          ) {
            continue;
          }
          document.deleteIn(path);
          cleanup(path);
        }
      },
    ],
  },
];
