import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize } from 'sequelize';

export const key = '0.29.0';

/**
 * Summary:
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
 *
 * @param db The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  logger.info('Making Resource.data non-nullable');
  await queryInterface.changeColumn('Resource', 'data', {
    allowNull: false,
    type: DataTypes.JSONB,
  });
  logger.info('Making OAuthAuthorization.accessToken non-nullable');
  await queryInterface.changeColumn('OAuthAuthorization', 'accessToken', {
    allowNull: false,
    type: DataTypes.TEXT,
  });
  logger.info('Removing App.longDescription');
  await queryInterface.sequelize.query(`
    ALTER TABLE "App" DROP COLUMN IF EXISTS "longDescription";
  `);
  logger.info('Removing AppReadme.deleted');
  await queryInterface.sequelize.query(`
    ALTER TABLE "AppReadme" DROP COLUMN IF EXISTS "deleted";
  `);
  logger.info('Making AppServiceSecret.AppId non-nullable');
  await queryInterface.changeColumn('AppServiceSecret', 'AppId', {
    allowNull: false,
    type: DataTypes.INTEGER,
  });
  logger.info('Changing default value of App.showAppDefinition to false');
  await queryInterface.changeColumn('App', 'showAppDefinition', {
    allowNull: false,
    defaultValue: false,
    type: DataTypes.BOOLEAN,
  });
  logger.info('Changing type of App.showAppsembleLogin to boolean');
  await queryInterface.sequelize.query(`
    ALTER TABLE "App"
      ALTER COLUMN "showAppsembleLogin" DROP DEFAULT,
      ALTER COLUMN "showAppsembleLogin" TYPE BOOLEAN USING CASE "showAppsembleLogin" WHEN 'true' THEN true WHEN 'false' THEN false ELSE "showAppsembleLogin"::BOOLEAN END,
      ALTER COLUMN "showAppsembleLogin" SET DEFAULT FALSE;
  `);
  logger.info('Making User.timezone non-nullable');
  await queryInterface.changeColumn('User', 'timezone', {
    type: DataTypes.STRING,
    allowNull: false,
  });
  logger.info('Making User.subscribed non-nullable');
  await queryInterface.changeColumn('User', 'subscribed', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  });
  logger.info('Making AppOAuth2Authorization.AppMemberId non-nullable');
  await queryInterface.changeColumn('AppOAuth2Authorization', 'AppMemberId', {
    type: DataTypes.UUID,
    allowNull: false,
  });
  logger.info('Changing type of AppSamlSecret.name to STRING');
  await queryInterface.changeColumn('AppSamlSecret', 'name', {
    type: DataTypes.STRING,
    allowNull: false,
  });
  logger.info('Removing AppScreenshot.name');
  await queryInterface.sequelize.query(`
    ALTER TABLE "AppScreenshot" DROP COLUMN IF EXISTS "name";
  `);
  logger.info('Making BlockVersion.examples non-nullable');
  await queryInterface.changeColumn('BlockVersion', 'examples', {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
  });
  logger.info('Renaming enum_Member_role to enum_OrganizationMember_role');
  await queryInterface.sequelize.query(`
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_Member_role') THEN
        ALTER TYPE "enum_Member_role" RENAME TO "enum_OrganizationMember_role";
      END IF;
    END $$;
  `);
  logger.info('Adding AccountManager to enum_OrganizationMember_role');
  await queryInterface.sequelize.query(`
    ALTER TYPE "enum_OrganizationMember_role" ADD VALUE 'AccountManager' AFTER 'Owner';
  `);
  logger.info(
    'Adding Translator, APIReader, APIUser, AccountManager to enum_OrganizationInvite_role',
  );
  await queryInterface.sequelize.query(`
    ALTER TYPE "enum_OrganizationInvite_role" ADD VALUE 'Translator' AFTER 'Member';
    ALTER TYPE "enum_OrganizationInvite_role" ADD VALUE 'APIReader' AFTER 'Translator';
    ALTER TYPE "enum_OrganizationInvite_role" ADD VALUE 'APIUser' AFTER 'APIReader';
    ALTER TYPE "enum_OrganizationInvite_role" ADD VALUE 'AccountManager' AFTER 'Maintainer';
  `);
  logger.info('Making SamlLoginRequest.timezone non-nullable');
  await queryInterface.changeColumn('SamlLoginRequest', 'timezone', {
    type: DataTypes.STRING,
    allowNull: false,
  });
  logger.info('Changing TeamInvite.role default value to member and to enum');
  await queryInterface.sequelize.query(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_TeamInvite_role') THEN
        CREATE TYPE "enum_TeamInvite_role" AS ENUM ('manager', 'member');
      END IF;
      ALTER TABLE "TeamInvite"
        ALTER COLUMN "role" TYPE "enum_TeamInvite_role" USING "role"::"enum_TeamInvite_role",
        ALTER COLUMN "role" SET DEFAULT 'member'::public."enum_TeamInvite_role";
    END $$;
  `);
  logger.info('Changing TeamMember.role default value to member');
  await queryInterface.sequelize.query(`
    ALTER TABLE "TeamMember" ALTER COLUMN "role" SET DEFAULT 'member';
  `);
  logger.info('Adding primary key to TeamMember');
  await queryInterface.sequelize.query(`
    ALTER TABLE "TeamMember" ADD PRIMARY KEY ("TeamId", "AppMemberId");
  `);
  logger.info('Making AppMember.scimActive non-nullable and default to false');
  await queryInterface.sequelize.query(`
    ALTER TABLE "AppMember"
      ALTER COLUMN "scimActive" DROP DEFAULT,
      ALTER COLUMN "scimActive" TYPE BOOLEAN USING CASE "scimActive" WHEN 'true' THEN true WHEN 'false' THEN false ELSE false END,
      ALTER COLUMN "scimActive" SET DEFAULT FALSE,
      ALTER COLUMN "scimActive" SET NOT NULL;
  `);
  logger.info('Making ResourceVersion.AppMemberId nullable');
  await queryInterface.changeColumn('ResourceVersion', 'AppMemberId', {
    type: DataTypes.UUID,
  });
  logger.info('Making Training.competences non-nullable');
  await queryInterface.changeColumn('Training', 'competences', {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: false,
  });
  logger.info('Making Training.difficultyLevel non-nullable');
  await queryInterface.changeColumn('Training', 'difficultyLevel', {
    type: DataTypes.INTEGER,
    allowNull: false,
  });
  logger.info('Renaming enum_App_locked-temp to enum_App_locked');
  await queryInterface.sequelize.query(`
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_App_locked-temp') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_App_locked') THEN
          ALTER TYPE "enum_App_locked-temp" RENAME TO "enum_App_locked";
        END IF;
      END IF;
    END $$;
  `);

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
    await queryInterface.sequelize.query(`
      ALTER TABLE "${table}" DROP CONSTRAINT IF EXISTS "${table}_${col}_fkey";
      ALTER TABLE "${table}" ADD FOREIGN KEY ("${col}") REFERENCES "${ref}" ("id") ON UPDATE ${update} ON DELETE ${del};
    `);
  }
}

/**
 * Summary:
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
 * - Renaming enum_OrganizationMember_role to enum_Member_role
 * - Removing AccountManager from enum_Member_role
 * - Removing Translator, APIReader, APIUser, AccountManager from enum_OrganizationInvite_role
 * - Making SamlLoginRequest.timezone nullable
 * - Changing TeamInvite.role default value to null and to string
 * - Changing TeamMember.role default value to null
 * - Removing primary key from TeamMember
 * - Making AppMember.scimActive nullable and default to true
 * - Making ResourceVersion.AppMemberId non-nullable
 * - Making Training.competences nullable
 * - Making Training.difficultyLevel nullable
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
 *
 * @param db The sequelize database.
 */
export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  logger.info('Making Resource.data nullable');
  await queryInterface.changeColumn('Resource', 'data', {
    type: DataTypes.JSONB,
    allowNull: true,
  });
  logger.info('Making OAuthAuthorization.accessToken nullable');
  await queryInterface.changeColumn('OAuthAuthorization', 'accessToken', {
    type: DataTypes.TEXT,
    allowNull: true,
  });
  logger.info('Adding column AppScreenshot.name');
  await queryInterface.addColumn('App', 'longDescription', {
    type: DataTypes.TEXT,
    allowNull: true,
  });
  logger.info('Adding column AppReadme.deleted');
  await queryInterface.addColumn('AppReadme', 'deleted', { allowNull: true, type: DataTypes.DATE });
  logger.info('Making AppServiceSecret.AppId nullable');
  await queryInterface.changeColumn('AppServiceSecret', 'AppId', {
    allowNull: true,
    type: DataTypes.INTEGER,
  });
  logger.info('Changing default value of App.showAppDefinition to true');
  await queryInterface.changeColumn('App', 'showAppDefinition', {
    allowNull: false,
    defaultValue: true,
    type: DataTypes.BOOLEAN,
  });
  logger.info('Changing type of App.showAppsembleLogin to string');
  await queryInterface.sequelize.query(`
    ALTER TABLE "App"
      ALTER COLUMN "showAppsembleLogin" DROP DEFAULT,
      ALTER COLUMN "showAppsembleLogin" TYPE VARCHAR(255) USING CASE "showAppsembleLogin" WHEN true THEN 'true' WHEN false THEN 'false' ELSE "showAppsembleLogin"::VARCHAR END,
      ALTER COLUMN "showAppsembleLogin" SET DEFAULT 'false';
  `);
  logger.info('Making User.timezone nullable');
  await queryInterface.changeColumn('User', 'timezone', {
    type: DataTypes.STRING,
    allowNull: true,
  });
  logger.info('Making User.subscribed nullable');
  await queryInterface.changeColumn('User', 'subscribed', {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  });
  logger.info('Making AppOAuth2Authorization.AppMemberId nullable');
  await queryInterface.changeColumn('AppOAuth2Authorization', 'AppMemberId', {
    type: DataTypes.UUID,
    allowNull: true,
  });
  logger.info('Changing type of AppSamlSecret.name to TEXT');
  await queryInterface.changeColumn('AppSamlSecret', 'name', {
    type: DataTypes.TEXT,
    allowNull: false,
  });
  logger.info('Adding column AppScreenshot.name');
  await queryInterface.addColumn('AppScreenshot', 'name', {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
    comment: null,
    primaryKey: false,
  });
  logger.info('Making BlockVersion.examples nullable');
  await queryInterface.changeColumn('BlockVersion', 'examples', {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: null,
  });
  logger.info('Renaming enum_OrganizationMember_role to enum_Member_role');
  await queryInterface.sequelize.query(`
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_OrganizationMember_role') THEN
        ALTER TYPE "enum_OrganizationMember_role" RENAME TO "enum_Member_role";
      END IF;
    END $$;
  `);
  logger.info('Removing AccountManager from enum_Member_role');
  await queryInterface.sequelize.query(`
    DELETE FROM pg_enum WHERE enumlabel = 'AccountManager' AND enumtypid = (
      SELECT oid FROM pg_type WHERE typname = 'enum_Member_role'
    );
  `);
  logger.info(
    'Removing Translator, APIReader, APIUser, AccountManager from enum_OrganizationInvite_role',
  );
  await queryInterface.sequelize.query(`
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
  `);
  logger.info('Making SamlLoginRequest.timezone nullable');
  await queryInterface.changeColumn('SamlLoginRequest', 'timezone', {
    type: DataTypes.STRING,
    allowNull: true,
  });
  logger.info('Changing TeamInvite.role default value to null and to string');
  await queryInterface.changeColumn('TeamInvite', 'role', {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
  });
  logger.info('Changing TeamMember.role default value to null');
  await queryInterface.sequelize.query(`
    ALTER TABLE "TeamMember" ALTER COLUMN "role" SET DEFAULT null;
  `);
  logger.info('Removing primary key from TeamMember');
  await queryInterface.sequelize.query(`
    ALTER TABLE "TeamMember" DROP CONSTRAINT "TeamMember_pkey";
  `);
  logger.info('Making AppMember.scimActive nullable and default to true');
  await queryInterface.changeColumn('AppMember', 'scimActive', {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: true,
  });
  logger.info('Making ResourceVersion.AppMemberId non-nullable');
  await queryInterface.changeColumn('ResourceVersion', 'AppMemberId', {
    type: DataTypes.UUID,
    allowNull: false,
  });
  logger.info('Making Training.competences nullable');
  await queryInterface.changeColumn('Training', 'competences', {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true,
  });
  logger.info('Making Training.difficultyLevel nullable');
  await queryInterface.changeColumn('Training', 'difficultyLevel', {
    type: DataTypes.INTEGER,
    allowNull: true,
  });
  logger.info('Making EmailAuthorization.UserId non-nullable');
  await queryInterface.changeColumn('EmailAuthorization', 'UserId', {
    type: DataTypes.UUID,
    allowNull: false,
  });

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
    await queryInterface.sequelize.query(`
      ALTER TABLE "${table}" DROP CONSTRAINT IF EXISTS "${table}_${col}_fkey";
      ALTER TABLE "${table}" ADD FOREIGN KEY ("${col}") REFERENCES "${ref}" ("id") ON UPDATE ${update} ON DELETE ${del};
    `);
  }
}
