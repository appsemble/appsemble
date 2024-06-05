import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize, type Transaction } from 'sequelize';

export const key = '0.29.0';

/**
 * Summary:
 * - Making AppMember.email non-nullable
 * - Making Resource.data non-nullable
 * - Making OAuthAuthorization.accessToken non-nullable
 * - Removing App.longDescription
 * - Removing AppReadme.deleted
 * - Making AppServiceSecret.AppId non-nullable
 * - Changing default value of App.showAppDefinition to false
 * - Changing type of App.showAppsembleLogin to boolean
 * - Making User.timezone non-nullable
 * - Making User.subscribed non-nullable
 * - Making AppOAuth2Authorization.AppMemberId non-nullable
 * - Changing type of AppSamlSecret.name to STRING
 * - Removing AppScreenshot.name
 * - Making BlockVersion.examples non-nullable and DEFAULT '[]'::jsonb
 * - Renaming enum_Member_role to enum_OrganizationMember_role
 * - Adding AccountManager to enum_OrganizationMember_role
 * - Adding Translator, APIReader, APIUser, AccountManager to enum_OrganizationInvite_role
 * - Making SamlLoginRequest.timezone non-nullable
 * - Changing TeamInvite.role default value to member and to enum
 * - Changing TeamMember.role default value to member
 * - Adding primary key to TeamMember
 * - Making AppMember.scimActive non-nullable and default to false
 * - Making ResourceVersion.AppMemberId nullable
 * - Making Training.competences non-nullable
 * - Making Training.difficultyLevel non-nullable
 * - Renaming TYPE enum_App_locked-temp to enum_App_locked if possible
 * - Setting AppServiceSecret.AppId constraints to ON UPDATE CASCADE ON DELETE CASCADE
 * - Setting AppBlockStyle.AppId constraints to ON UPDATE CASCADE ON DELETE CASCADE
 * - Setting AppCollection.OrganizationId constraints to ON UPDATE CASCADE ON DELETE CASCADE
 * - Setting AppCollectionApp.AppCollectionId constraints to ON UPDATE CASCADE ON DELETE CASCADE
 * - Setting AppCollectionApp.AppId constraints to ON UPDATE CASCADE ON DELETE CASCADE
 * - Setting AppEmailQuotaLog.AppId constraints to ON UPDATE CASCADE ON DELETE NO ACTION
 * - Setting AppSnapshot.UserId constraints to ON UPDATE CASCADE ON DELETE SET NULL
 * - Setting AppSubscription.AppId constraints to ON UPDATE CASCADE ON DELETE CASCADE
 * - Setting Resource.AppId constraints to ON UPDATE CASCADE ON DELETE CASCADE
 * - Setting Asset.AppId constraints to ON UPDATE CASCADE ON DELETE CASCADE
 * - Setting ResourceVersion.ResourceId constraints to ON UPDATE CASCADE ON DELETE CASCADE
 * - Setting TeamInvite.TeamId constraints to ON UPDATE CASCADE ON DELETE NO ACTION
 * - Setting UserTraining.UserId constraints to ON UPDATE CASCADE ON DELETE CASCADE
 * - Setting UserTraining.TrainingId constraints to ON UPDATE CASCADE ON DELETE CASCADE
 * - Setting TrainingBlock.TrainingId constraints to ON UPDATE CASCADE ON DELETE CASCADE
 * - Creating unique index UniqueNameIndex on AppVariable (name, AppId)
 * - Creating unique index UniqueRatingIndex on AppRating (AppId, UserId)
 * - Creating unique index UserTraining_UserId_TrainingId_key on UserTraining (UserId, TrainingId)
 *
 * @param transaction The sequelize Transaction.
 * @param db The sequelize database.
 */
export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  logger.info('Making AppMember.email non-nullable');
  logger.warn(`The following may result in errors depending on the data present in the database.
In case the database contains AppMembers with emails set to NULL make sure to delete those first
as this migration requires AppMembers to have an email set.

  SELECT COUNT(*) FROM "AppMember" WHERE "email" IS NULL;
`);
  await queryInterface.changeColumn(
    'AppMember',
    'email',
    {
      type: DataTypes.STRING,
      allowNull: false,
    },
    { transaction },
  );
  logger.warn('Making Resource.data non-nullable');
  logger.warn(`The following may result in errors depending on the data present in the database.
In case the database contains Resources with data equal to null, the following will fail.
When that happens you may want to backup these resources, before removing them manually.`);
  await queryInterface.changeColumn(
    'Resource',
    'data',
    {
      allowNull: false,
      type: DataTypes.JSONB,
    },
    { transaction },
  );
  logger.warn('Making OAuthAuthorization.accessToken non-nullable');
  logger.warn(`The following may result in errors depending on the data present in the database.
In case the database contains OAuthAuthorizations with accessToken equal to null, the following will fail.
When that happens you may want to delete all OAuthAuthorizations with accessToken equal to null as those
shouldn't be present anyways.`);
  await queryInterface.changeColumn(
    'OAuthAuthorization',
    'accessToken',
    {
      allowNull: false,
      type: DataTypes.TEXT,
    },
    { transaction },
  );
  logger.info('Removing App.longDescription');
  await queryInterface.sequelize.query(
    `
    ALTER TABLE "App" DROP COLUMN IF EXISTS "longDescription";
  `,
    { transaction },
  );
  logger.info('Removing AppReadme.deleted');
  await queryInterface.sequelize.query(
    `
    ALTER TABLE "AppReadme" DROP COLUMN IF EXISTS "deleted";
  `,
    { transaction },
  );
  logger.warn('Making AppServiceSecret.AppId non-nullable');
  logger.warn(`The following may result in errors depending on the data present in the database.
In case the database contains AppServiceSecret with AppId equal to null, the following will fail.
When that happens you may want to delete all AppServiceSecrets with AppId equal to null.`);
  await queryInterface.changeColumn(
    'AppServiceSecret',
    'AppId',
    {
      allowNull: false,
      type: DataTypes.INTEGER,
    },
    { transaction },
  );
  logger.info('Changing default value of App.showAppDefinition to false');
  await queryInterface.changeColumn(
    'App',
    'showAppDefinition',
    {
      allowNull: false,
      defaultValue: false,
      type: DataTypes.BOOLEAN,
    },
    { transaction },
  );
  logger.info('Changing type of App.showAppsembleLogin to boolean');
  await queryInterface.sequelize.query(
    `
    ALTER TABLE "App"
      ALTER COLUMN "showAppsembleLogin" DROP DEFAULT,
      ALTER COLUMN "showAppsembleLogin" TYPE BOOLEAN USING CASE "showAppsembleLogin" WHEN 'true' THEN true WHEN 'false' THEN false ELSE "showAppsembleLogin"::BOOLEAN END,
      ALTER COLUMN "showAppsembleLogin" SET DEFAULT FALSE;
  `,
    { transaction },
  );
  logger.warn('Making User.timezone non-nullable');
  logger.warn(`The following may result in errors depending on the data present in the database.
In case the database contains Users with timezone equal to null, the following will fail.
When that happens you may want to set a default timezone for those Users, or delete them if possible.`);
  await queryInterface.changeColumn(
    'User',
    'timezone',
    {
      type: DataTypes.STRING,
      allowNull: false,
    },
    { transaction },
  );
  logger.info('Making User.subscribed non-nullable');
  await queryInterface.changeColumn(
    'User',
    'subscribed',
    {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    { transaction },
  );
  logger.warn('Making AppOAuth2Authorization.AppMemberId non-nullable');
  logger.warn(`The following may result in errors depending on the data present in the database.
In case the database contains AppOAuth2Authorizations with AppMemberId equal to null, the following will fail.
When that happens you may want to consider checking where the AppOAuth2Authorizations came from with the following command,
and determine whether these AppOAuth2Authorizations can be removed.

  SELECT "sub","AppId" FROM "AppOAuth2Authorization" WHERE "AppMemberId" IS NULL;
`);
  await queryInterface.changeColumn(
    'AppOAuth2Authorization',
    'AppMemberId',
    {
      type: DataTypes.UUID,
      allowNull: false,
    },
    { transaction },
  );
  logger.warn('Changing type of AppSamlSecret.name to STRING');
  logger.warn(`The following may result in errors depending on the data present in the database.
In case the database contains AppSamlSecrets with names longer than 255 characters, the following may fail.
When that happens you may want to manually look for \`AppSamlSecret.name\` to delete the AppSamlSecret,
or keep a substring of those names.`);
  await queryInterface.changeColumn(
    'AppSamlSecret',
    'name',
    {
      type: DataTypes.STRING,
      allowNull: false,
    },
    { transaction },
  );
  logger.info('Removing AppScreenshot.name');
  await queryInterface.sequelize.query(
    `
    ALTER TABLE "AppScreenshot" DROP COLUMN IF EXISTS "name";
  `,
    { transaction },
  );
  logger.info('Making BlockVersion.examples non-nullable');
  await queryInterface.changeColumn(
    'BlockVersion',
    'examples',
    {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },
    { transaction },
  );
  logger.info('Renaming enum_Member_role to enum_OrganizationMember_role');
  await queryInterface.sequelize.query(
    `
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_Member_role') THEN
        ALTER TYPE "enum_Member_role" RENAME TO "enum_OrganizationMember_role";
      END IF;
    END $$;
  `,
    { transaction },
  );
  logger.info('Adding AccountManager to enum_OrganizationMember_role');
  await queryInterface.sequelize.query(
    `
    ALTER TYPE "enum_OrganizationMember_role" ADD VALUE 'AccountManager' AFTER 'Owner';
  `,
    { transaction },
  );
  logger.info(
    'Adding Translator, APIReader, APIUser, AccountManager to enum_OrganizationInvite_role',
  );
  await queryInterface.sequelize.query(
    `
    ALTER TYPE "enum_OrganizationInvite_role" ADD VALUE 'Translator' AFTER 'Member';
    ALTER TYPE "enum_OrganizationInvite_role" ADD VALUE 'APIReader' AFTER 'Translator';
    ALTER TYPE "enum_OrganizationInvite_role" ADD VALUE 'APIUser' AFTER 'APIReader';
    ALTER TYPE "enum_OrganizationInvite_role" ADD VALUE 'AccountManager' AFTER 'Maintainer';
  `,
    { transaction },
  );
  logger.warn('Making SamlLoginRequest.timezone non-nullable');
  logger.warn(`The following may result in errors depending on the data present in the database.
In case the database contains SamlLoginRequests with timezone equal to null, the following will fail.
When that happens you may want to consider checking where the SamlLoginRequest came from with the following command,
and determine whether to add a default timezone manually or to remove those.

  SELECT "email","UserId" FROM "SamlLoginRequest" WHERE "timezone" IS NULL;
`);
  await queryInterface.changeColumn(
    'SamlLoginRequest',
    'timezone',
    {
      type: DataTypes.STRING,
      allowNull: false,
    },
    { transaction },
  );
  logger.info('Changing TeamInvite.role default value to member and to enum');
  await queryInterface.sequelize.query(
    `
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_TeamInvite_role') THEN
        CREATE TYPE "enum_TeamInvite_role" AS ENUM ('manager', 'member');
      END IF;
      ALTER TABLE "TeamInvite"
        ALTER COLUMN "role" TYPE "enum_TeamInvite_role" USING "role"::"enum_TeamInvite_role",
        ALTER COLUMN "role" SET DEFAULT 'member'::public."enum_TeamInvite_role";
    END $$;
  `,
    { transaction },
  );
  logger.info('Changing TeamMember.role default value to member');
  await queryInterface.sequelize.query(
    `
    ALTER TABLE "TeamMember" ALTER COLUMN "role" SET DEFAULT 'member';
    `,
    { transaction },
  );
  logger.warn('Adding primary key to TeamMember');
  logger.warn(`The following may result in errors depending on the data present in the database.
In case the database contains duplicate TeamMembers make sure to delete those first as this migration,
requires unique TeamMembers for it to work. The following database query should help to find those.

  SELECT "TeamId", "AppMemberId", COUNT(*) AS "DuplicateCount"
  FROM "TeamMember" GROUP BY "AppMemberId", "TeamId"
  HAVING COUNT(*) > 1;
`);
  await queryInterface.sequelize.query(
    `
    ALTER TABLE "TeamMember" ADD PRIMARY KEY ("TeamId", "AppMemberId");
  `,
    { transaction },
  );
  logger.info('Making AppMember.scimActive non-nullable and default to false');
  await queryInterface.sequelize.query(
    `
    ALTER TABLE "AppMember"
      ALTER COLUMN "scimActive" DROP DEFAULT,
      ALTER COLUMN "scimActive" TYPE BOOLEAN USING CASE "scimActive" WHEN 'true' THEN true WHEN 'false' THEN false ELSE false END,
      ALTER COLUMN "scimActive" SET DEFAULT FALSE,
      ALTER COLUMN "scimActive" SET NOT NULL;
  `,
    { transaction },
  );
  logger.info('Making ResourceVersion.AppMemberId nullable');
  await queryInterface.changeColumn(
    'ResourceVersion',
    'AppMemberId',
    {
      type: DataTypes.UUID,
    },
    { transaction },
  );
  logger.warn('Making Training.competences non-nullable');
  logger.warn(`The following may result in errors depending on the data present in the database.
In case the database contains Trainings with competences equal to null, the following will fail.
When that happens you may want to consider checking where the Trainings belong to, and add
competences manually.`);
  await queryInterface.changeColumn(
    'Training',
    'competences',
    {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
    },
    { transaction },
  );
  logger.warn('Making Training.difficultyLevel non-nullable');
  logger.warn(`The following may result in errors depending on the data present in the database.
In case the database contains Trainings with difficultyLevel equal to null, the following will fail.
When that happens you may want to consider checking where the Trainings belong to, and add
difficultyLevel manually.`);
  await queryInterface.changeColumn(
    'Training',
    'difficultyLevel',
    {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    { transaction },
  );
  logger.info('Renaming enum_App_locked-temp to enum_App_locked');
  await queryInterface.sequelize.query(
    `
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_App_locked-temp') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_App_locked') THEN
          ALTER TYPE "enum_App_locked-temp" RENAME TO "enum_App_locked";
        END IF;
      END IF;
    END $$;
  `,
    { transaction },
  );

  const changes = [
    ['AppServiceSecret', 'AppId', 'App', 'CASCADE', 'CASCADE'],
    ['AppBlockStyle', 'AppId', 'App', 'CASCADE', 'CASCADE'],
    ['AppCollection', 'OrganizationId', 'Organization', 'CASCADE', 'CASCADE'],
    ['AppCollectionApp', 'AppCollectionId', 'AppCollection', 'CASCADE', 'CASCADE'],
    ['AppCollectionApp', 'AppId', 'App', 'CASCADE', 'CASCADE'],
    ['AppEmailQuotaLog', 'AppId', 'App', 'CASCADE', 'NO ACTION'],
    ['AppSnapshot', 'UserId', 'User', 'CASCADE', 'SET NULL'],
    ['AppSubscription', 'AppId', 'App', 'CASCADE', 'CASCADE'],
    ['Resource', 'AppId', 'App', 'CASCADE', 'CASCADE'],
    ['Asset', 'AppId', 'App', 'CASCADE', 'CASCADE'],
    ['ResourceVersion', 'ResourceId', 'Resource', 'CASCADE', 'CASCADE'],
    ['TeamInvite', 'TeamId', 'Team', 'CASCADE', 'NO ACTION'],
    ['UserTraining', 'UserId', 'User', 'CASCADE', 'CASCADE'],
    ['UserTraining', 'TrainingId', 'Training', 'CASCADE', 'CASCADE'],
    ['TrainingBlock', 'TrainingId', 'Training', 'CASCADE', 'CASCADE'],
  ] satisfies [string, string, string, string, string][];
  for (const [table, col, ref, update, del] of changes) {
    logger.info(`Setting ${table}.${col} constraints to ON UPDATE ${update} ON DELETE ${del}`);
    await queryInterface.sequelize.query(
      `
      ALTER TABLE "${table}" DROP CONSTRAINT IF EXISTS "${table}_${col}_fkey";
      ALTER TABLE "${table}" ADD FOREIGN KEY ("${col}") REFERENCES "${ref}" ("id") ON UPDATE ${update} ON DELETE ${del};
    `,
      { transaction },
    );
  }

  const indexes = [
    ['AppVariable', 'UniqueNameIndex', ['name', 'AppId']],
    ['AppRating', 'UniqueRatingIndex', ['AppId', 'UserId']],
    // The following is automatically created with db.sync()
    ['UserTraining', 'UserTraining_UserId_TrainingId_key', ['UserId', 'TrainingId']],
  ] satisfies [string, string, string[]][];
  for (const [table, name, cols] of indexes) {
    logger.info(`Creating unique index ${name} on ${table} (${cols.join(', ')})`);
    await queryInterface.addIndex(table, cols, {
      name,
      unique: true,
      transaction,
    });
  }
}

/**
 * Summary:
 * - Making AppMember.email nullable
 * - Making Resource.data nullable
 * - Making OAuthAuthorization.accessToken nullable
 * - Adding column App.longDescription
 * - Adding column AppReadme.deleted
 * - Making AppServiceSecret.AppId nullable
 * - Changing default value of App.showAppDefinition to true
 * - Changing type of App.showAppsembleLogin to string
 * - Making User.timezone nullable
 * - Making User.subscribed nullable
 * - Making AppOAuth2Authorization.AppMemberId nullable
 * - Changing type of AppSamlSecret.name to TEXT
 * - Adding column AppScreenshot.name
 * - Making BlockVersion.examples nullable and DEFAULT to null
 * - Removing AccountManager from enum_OrganizationMember_role
 * - Removing Translator, APIReader, APIUser, AccountManager from enum_OrganizationInvite_role
 * - Making SamlLoginRequest.timezone nullable
 * - Changing TeamInvite.role to string
 * - Removing type enum enum_TeamInvite_role
 * - Changing TeamMember.role default value to null
 * - Removing primary key from TeamMember
 * - Making AppMember.scimActive nullable and default to true
 * - Making ResourceVersion.AppMemberId non-nullable
 * - Making Training.competences nullable
 * - Making Training.difficultyLevel nullable
 * - Renaming enum_App_locked to enum_App_locked-temp
 * - Setting AppServiceSecret.AppId constraints to ON UPDATE NO ACTION ON DELETE NO ACTION
 * - Setting AppBlockStyle.AppId constraints to ON UPDATE CASCADE ON DELETE NO ACTION
 * - Setting AppCollection.OrganizationId constraints to ON UPDATE NO ACTION ON DELETE NO ACTION
 * - Setting AppCollectionApp.AppCollectionId constraints to ON UPDATE NO ACTION ON DELETE CASCADE
 * - Setting AppCollectionApp.AppId constraints to ON UPDATE NO ACTION ON DELETE NO ACTION
 * - Setting AppEmailQuotaLog.AppId constraints to ON UPDATE NO ACTION ON DELETE NO ACTION
 * - Setting AppSnapshot.UserId constraints to ON UPDATE NO ACTION ON DELETE NO ACTION
 * - Setting AppSubscription.AppId constraints to ON UPDATE CASCADE ON DELETE NO ACTION
 * - Setting Resource.AppId constraints to ON UPDATE CASCADE ON DELETE SET NULL
 * - Setting Asset.AppId constraints to ON UPDATE CASCADE ON DELETE NO ACTION
 * - Setting ResourceVersion.ResourceId constraints to ON UPDATE NO ACTION ON DELETE CASCADE
 * - Setting TeamInvite.TeamId constraints to ON UPDATE NO ACTION ON DELETE NO ACTION
 * - Setting UserTraining.UserId constraints to ON UPDATE NO ACTION ON DELETE NO ACTION
 * - Setting UserTraining.TrainingId constraints to ON UPDATE NO ACTION ON DELETE NO ACTION
 * - Setting TrainingBlock.TrainingId constraints to ON UPDATE NO ACTION ON DELETE NO ACTION
 * - Removing unique index UniqueNameIndex from AppVariable (name, AppId)
 * - Removing unique index UniqueRatingIndex from AppRating (AppId, UserId)
 * - Removing unique index UserTraining_UserId_TrainingId_key from UserTraining (UserId, TrainingId)
 *
 * @param transaction The sequelize Transaction.
 * @param db The sequelize database.
 */
export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  logger.info('Making AppMember.email nullable');
  await queryInterface.changeColumn(
    'AppMember',
    'email',
    {
      type: DataTypes.STRING,
      allowNull: true,
    },
    { transaction },
  );
  logger.info('Making Resource.data nullable');
  await queryInterface.changeColumn(
    'Resource',
    'data',
    {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    { transaction },
  );
  logger.info('Making OAuthAuthorization.accessToken nullable');
  await queryInterface.changeColumn(
    'OAuthAuthorization',
    'accessToken',
    {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    { transaction },
  );
  logger.info('Adding column AppScreenshot.name');
  await queryInterface.addColumn(
    'App',
    'longDescription',
    {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    { transaction },
  );
  logger.info('Adding column AppReadme.deleted');
  await queryInterface.addColumn(
    'AppReadme',
    'deleted',
    { allowNull: true, type: DataTypes.DATE },
    { transaction },
  );
  logger.info('Making AppServiceSecret.AppId nullable');
  await queryInterface.changeColumn(
    'AppServiceSecret',
    'AppId',
    {
      allowNull: true,
      type: DataTypes.INTEGER,
    },
    { transaction },
  );
  logger.info('Changing default value of App.showAppDefinition to true');
  await queryInterface.changeColumn(
    'App',
    'showAppDefinition',
    {
      allowNull: false,
      defaultValue: true,
      type: DataTypes.BOOLEAN,
    },
    { transaction },
  );
  logger.info('Changing type of App.showAppsembleLogin to string');
  await queryInterface.sequelize.query(
    `
    ALTER TABLE "App"
      ALTER COLUMN "showAppsembleLogin" DROP DEFAULT,
      ALTER COLUMN "showAppsembleLogin" TYPE VARCHAR(255) USING CASE "showAppsembleLogin" WHEN true THEN 'true' WHEN false THEN 'false' ELSE "showAppsembleLogin"::VARCHAR END,
      ALTER COLUMN "showAppsembleLogin" SET DEFAULT 'false';
  `,
    { transaction },
  );
  logger.info('Making User.timezone nullable');
  await queryInterface.changeColumn(
    'User',
    'timezone',
    {
      type: DataTypes.STRING,
      allowNull: true,
    },
    { transaction },
  );
  logger.info('Making User.subscribed nullable');
  await queryInterface.changeColumn(
    'User',
    'subscribed',
    {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    { transaction },
  );
  logger.info('Making AppOAuth2Authorization.AppMemberId nullable');
  await queryInterface.changeColumn(
    'AppOAuth2Authorization',
    'AppMemberId',
    {
      type: DataTypes.UUID,
      allowNull: true,
    },
    { transaction },
  );
  logger.info('Changing type of AppSamlSecret.name to TEXT');
  await queryInterface.changeColumn(
    'AppSamlSecret',
    'name',
    {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    { transaction },
  );
  logger.info('Adding column AppScreenshot.name');
  await queryInterface.addColumn(
    'AppScreenshot',
    'name',
    {
      type: DataTypes.STRING,
      allowNull: true,
    },
    { transaction },
  );
  logger.info('Making BlockVersion.examples nullable');
  await queryInterface.changeColumn(
    'BlockVersion',
    'examples',
    {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: null,
    },
    { transaction },
  );
  logger.info('Removing AccountManager from enum_OrganizationMember_role');
  await queryInterface.sequelize.query(
    `
    DELETE FROM pg_enum WHERE enumlabel = 'AccountManager' AND enumtypid = (
      SELECT oid FROM pg_type WHERE typname = 'enum_OrganizationMember_role'
    );
    `,
    { transaction },
  );
  logger.info(
    'Removing Translator, APIReader, APIUser, AccountManager from enum_OrganizationInvite_role',
  );
  await queryInterface.sequelize.query(
    `
    DELETE FROM pg_enum WHERE enumlabel = 'Translator' AND enumtypid = (
      SELECT oid FROM pg_type WHERE typname = 'enum_OrganizationInvite_role'
    );
    DELETE FROM pg_enum WHERE enumlabel = 'APIReader' AND enumtypid = (
      SELECT oid FROM pg_type WHERE typname = 'enum_OrganizationInvite_role'
    );
    DELETE FROM pg_enum WHERE enumlabel = 'APIUser' AND enumtypid = (
      SELECT oid FROM pg_type WHERE typname = 'enum_OrganizationInvite_role'
    );
    DELETE FROM pg_enum WHERE enumlabel = 'AccountManager' AND enumtypid = (
      SELECT oid FROM pg_type WHERE typname = 'enum_OrganizationInvite_role'
    );
  `,
    { transaction },
  );
  logger.info('Making SamlLoginRequest.timezone nullable');
  await queryInterface.changeColumn(
    'SamlLoginRequest',
    'timezone',
    {
      type: DataTypes.STRING,
      allowNull: true,
    },
    { transaction },
  );
  logger.info('Changing TeamInvite.role to string');
  await queryInterface.changeColumn(
    'TeamInvite',
    'role',
    {
      type: DataTypes.STRING,
      allowNull: false,
    },
    { transaction },
  );
  logger.info('Removing type enum enum_TeamInvite_role');
  await queryInterface.sequelize.query('DROP TYPE "enum_TeamInvite_role";', { transaction });
  logger.info('Changing TeamMember.role default value to null');
  await queryInterface.sequelize.query(
    `
    ALTER TABLE "TeamMember" ALTER COLUMN "role" SET DEFAULT null;
  `,
    { transaction },
  );
  logger.info('Removing primary key from TeamMember');
  await queryInterface.sequelize.query(
    `
    ALTER TABLE "TeamMember" DROP CONSTRAINT "TeamMember_pkey";
  `,
    { transaction },
  );
  logger.info('Making AppMember.scimActive nullable and default to true');
  await queryInterface.changeColumn(
    'AppMember',
    'scimActive',
    {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true,
    },
    { transaction },
  );
  logger.warn('Making ResourceVersion.AppMemberId non-nullable');
  logger.warn(`The following may result in errors depending on the data present in the database.
In case the database contains ResourceVersions with AppMemberId equal to null, the following will fail.
When that happens you may want to consider checking to what app and app member the ResourceVersions belong to,
and removing them manually.`);
  await queryInterface.changeColumn(
    'ResourceVersion',
    'AppMemberId',
    {
      type: DataTypes.UUID,
      allowNull: false,
    },
    { transaction },
  );
  logger.info('Making Training.competences nullable');
  await queryInterface.changeColumn(
    'Training',
    'competences',
    {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
    },
    { transaction },
  );
  logger.info('Making Training.difficultyLevel nullable');
  await queryInterface.changeColumn(
    'Training',
    'difficultyLevel',
    {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    { transaction },
  );
  logger.info('Renaming enum_App_locked to enum_App_locked-temp');
  await queryInterface.sequelize.query(
    `
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_App_locked') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_App_locked-temp') THEN
          ALTER TYPE "enum_App_locked" RENAME TO "enum_App_locked-temp";
        END IF;
      END IF;
    END $$;
  `,
    { transaction },
  );
  logger.warn('Making EmailAuthorization.UserId non-nullable');
  logger.warn(`The following may result in errors depending on the data present in the database.
In case the database contains EmailAuthorizations with UserId equal to null, the following will fail.
When that happens you may want to consider checking what email was used and inform the user, to
connect the ID manually or to delete them.

  SELECT "email" FROM "EmailAuthorization" WHERE "UserId" IS NULL;
`);
  await queryInterface.changeColumn(
    'EmailAuthorization',
    'UserId',
    {
      type: DataTypes.UUID,
      allowNull: false,
    },
    { transaction },
  );

  const changes = [
    ['AppServiceSecret', 'AppId', 'App', 'NO ACTION', 'NO ACTION'],
    ['AppBlockStyle', 'AppId', 'App', 'CASCADE', 'NO ACTION'],
    ['AppCollection', 'OrganizationId', 'Organization', 'NO ACTION', 'NO ACTION'],
    ['AppCollectionApp', 'AppCollectionId', 'AppCollection', 'NO ACTION', 'CASCADE'],
    ['AppCollectionApp', 'AppId', 'App', 'NO ACTION', 'NO ACTION'],
    ['AppEmailQuotaLog', 'AppId', 'App', 'NO ACTION', 'NO ACTION'],
    ['AppSnapshot', 'UserId', 'User', 'NO ACTION', 'NO ACTION'],
    ['AppSubscription', 'AppId', 'App', 'CASCADE', 'NO ACTION'],
    ['Resource', 'AppId', 'App', 'CASCADE', 'SET NULL'],
    ['Asset', 'AppId', 'App', 'CASCADE', 'NO ACTION'],
    ['ResourceVersion', 'ResourceId', 'Resource', 'NO ACTION', 'CASCADE'],
    ['TeamInvite', 'TeamId', 'Team', 'NO ACTION', 'NO ACTION'],
    ['UserTraining', 'UserId', 'User', 'NO ACTION', 'NO ACTION'],
    ['UserTraining', 'TrainingId', 'Training', 'NO ACTION', 'NO ACTION'],
    ['TrainingBlock', 'TrainingId', 'Training', 'NO ACTION', 'NO ACTION'],
  ] satisfies [string, string, string, string, string][];
  for (const [table, col, ref, update, del] of changes) {
    logger.info(`Setting ${table}.${col} constraints to ON UPDATE ${update} ON DELETE ${del}`);
    await queryInterface.sequelize.query(
      `
      ALTER TABLE "${table}" DROP CONSTRAINT IF EXISTS "${table}_${col}_fkey";
      ALTER TABLE "${table}" ADD FOREIGN KEY ("${col}") REFERENCES "${ref}" ("id") ON UPDATE ${update} ON DELETE ${del};
    `,
      { transaction },
    );
  }

  const indexes = [
    ['AppVariable', 'UniqueNameIndex', ['name', 'AppId']],
    ['AppRating', 'UniqueRatingIndex', ['AppId', 'UserId']],
    ['UserTraining', 'UserTraining_UserId_TrainingId_key', ['UserId', 'TrainingId']],
  ] satisfies [string, string, string[]][];
  for (const [table, name, cols] of indexes) {
    logger.info(`Removing unique index ${name} from ${table} (${cols.join(', ')})`);
    await queryInterface.removeIndex(table, name, { transaction });
  }
}
