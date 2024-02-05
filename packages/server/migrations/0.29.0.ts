import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize } from 'sequelize';

export const key = '0.29.0';

/**
 * Summary:
 * - Making AppServiceSecret.AppId non-nullable
 * - Changing default value of App.showAppDefinition to false
 * - Changing type of App.showAppsembleLogin to boolean
 * - Making User.timezone non-nullable
 * - Making User.subscribed non-nullable
 * - Making AppOAuth2Authorization.AppMemberId non-nullable
 * - Changing type of AppSamlSecret.name to STRING
 * - Making AppSamlAuthorization.AppMemberId non-nullable
 * - Removing AppScreenshot.name
 * - Making BlockVersion.examples non-nullable
 * - Renaming enum_Member_role to enum_OrganizationMember_role
 * - Adding AccountManager to enum_OrganizationMember_role
 * - Adding Translator, APIReader, APIUser, AccountManager to enum_OrganizationInvite_role
 * - Making SamlLoginRequest.timezone non-nullable
 * - Changing TeamInvite.role default value to member
 * - Changing TeamMember.role default value to member
 * - Adding primary key to TeamMember
 * - Changing AppMember.scimActive default value to null
 * - Making ResourceVersion.AppMemberId nullable
 * - Making Training.competences non-nullable
 * - Making Training.difficultyLevel non-nullable
 * - Making EmailAuthorization.UserId nullable
 * - Making AppMember.UserId nullable
 * - Setting AppServiceSecret.AppId constraints to ON UPDATE CASCADE ON DELETE CASCADE
 * - Setting AppBlockStyle.AppId constraints to ON UPDATE CASCADE ON DELETE CASCADE
 * - Setting AppCollection.OrganizationId constraints to ON UPDATE CASCADE ON DELETE NO ACTION
 * - Setting AppCollectionApp.AppCollectionId constraints to ON UPDATE CASCADE ON DELETE CASCADE
 * - Setting AppCollectionApp.AppId constraints to ON UPDATE CASCADE ON DELETE NO ACTION
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
  logger.info('Making AppSamlAuthorization.AppMemberId non-nullable');
  await queryInterface.changeColumn('AppSamlAuthorization', 'AppMemberId', {
    type: DataTypes.UUID,
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
  logger.info('Changing TeamInvite.role default value to member');
  await queryInterface.changeColumn('TeamInvite', 'role', {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'member',
  });
  logger.info('Changing TeamMember.role default value to member');
  await queryInterface.sequelize.query(`
    ALTER TABLE "TeamMember" ALTER COLUMN "role" SET DEFAULT 'member';
  `);
  logger.info('Adding primary key to TeamMember');
  await queryInterface.sequelize.query(`
    ALTER TABLE "TeamMember" ADD PRIMARY KEY ("TeamId", "AppMemberId");
  `);
  logger.info('Changing AppMember.scimActive default value to null');
  await queryInterface.changeColumn('AppMember', 'scimActive', {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: null,
  });
  // Questionable: non-nullable in production, nullable in model, tests fail if set to non-nullable
  // in model.
  logger.info('Making ResourceVersion.AppMemberId nullable');
  await queryInterface.changeColumn('ResourceVersion', 'AppMemberId', {
    type: DataTypes.UUID,
    allowNull: true,
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
  // Questionable: non-nullable in production, nullable in model, tests fail if set to non-nullable
  // in model.
  logger.info('Making EmailAuthorization.UserId nullable');
  await queryInterface.changeColumn('EmailAuthorization', 'UserId', {
    type: DataTypes.UUID,
    allowNull: true,
  });
  // Questionable: non-nullable in production, nullable in model, tests fail if set to non-nullable
  // in model.
  logger.info('Making AppMember.UserId nullable');
  await queryInterface.changeColumn('AppMember', 'UserId', {
    type: DataTypes.UUID,
    allowNull: true,
  });
  logger.info('Renaming enum_App_locked-temp to enum_App_locked');
  await queryInterface.sequelize.query(`
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_App_locked-temp') THEN
        ALTER TYPE "enum_App_locked-temp" RENAME TO "enum_App_locked";
      END IF;
    END $$;
  `);

  const changes = [
    ['AppServiceSecret', 'AppId', 'App', 'CASCADE', 'CASCADE'],
    ['AppBlockStyle', 'AppId', 'App', 'CASCADE', 'CASCADE'],
    ['AppCollection', 'OrganizationId', 'Organization', 'CASCADE', 'NO ACTION'],
    ['AppCollectionApp', 'AppCollectionId', 'AppCollection', 'CASCADE', 'CASCADE'],
    ['AppCollectionApp', 'AppId', 'App', 'CASCADE', 'NO ACTION'],
    ['AppEmailQuotaLog', 'AppId', 'App', 'CASCADE', 'NO ACTION'],
    ['AppSnapshot', 'UserId', 'User', 'CASCADE', 'SET NULL'],
    ['AppSubscription', 'AppId', 'App', 'CASCADE', 'CASCADE'],
    // Questionable: ON UPDATE CASCADE ON DELETE SET NULL in production, but column is also
    // non-nullable in production.
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
 * - Making AppServiceSecret.AppId nullable
 * - Changing default value of App.showAppDefinition to true
 * - Changing type of App.showAppsembleLogin to string
 * - Making User.timezone nullable
 * - Making User.subscribed nullable
 * - Making AppOAuth2Authorization.AppMemberId nullable
 * - Changing type of AppSamlSecret.name to TEXT
 * - Making AppSamlAuthorization.AppMemberId nullable
 * - Adding column AppScreenshot.name
 * - Making BlockVersion.examples nullable
 * - Renaming enum_OrganizationMember_role to enum_Member_role
 * - Removing AccountManager from enum_Member_role
 * - Removing Translator, APIReader, APIUser, AccountManager from enum_OrganizationInvite_role
 * - Making SamlLoginRequest.timezone nullable
 * - Changing TeamInvite.role default value to null
 * - Changing TeamMember.role default value to null
 * - Removing primary key from TeamMember
 * - Changing AppMember.scimActive default value to true
 * - Making ResourceVersion.AppMemberId non-nullable
 * - Making Training.competences nullable
 * - Making Training.difficultyLevel nullable
 * - Making EmailAuthorization.UserId non-nullable
 * - Making AppMember.UserId non-nullable
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
  logger.info('Making AppSamlAuthorization.AppMemberId nullable');
  await queryInterface.changeColumn('AppSamlAuthorization', 'AppMemberId', {
    type: DataTypes.UUID,
    allowNull: true,
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
  logger.info('Changing TeamInvite.role default value to null');
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
  logger.info('Changing AppMember.scimActive default value to true');
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
  logger.info('Making AppMember.UserId non-nullable');
  await queryInterface.changeColumn('AppMember', 'UserId', {
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
