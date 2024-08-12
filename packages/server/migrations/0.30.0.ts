import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize, type Transaction } from 'sequelize';

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
