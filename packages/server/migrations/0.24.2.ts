import { DataTypes, type Sequelize } from 'sequelize';

export const key = '0.24.2';

/**
 * Summary:
 *
 * @param db The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  await queryInterface.changeColumn('AppServiceSecret', 'AppId', {
    allowNull: false,
    type: DataTypes.INTEGER,
  });
  await queryInterface.changeColumn('App', 'showAppDefinition', {
    allowNull: false,
    defaultValue: false,
    type: DataTypes.BOOLEAN,
  });
  await queryInterface.sequelize.query(`
    ALTER TABLE "App" ALTER COLUMN "showAppsembleLogin" TYPE BOOLEAN USING CASE "showAppsembleLogin" WHEN 'true' THEN true WHEN 'false' THEN false ELSE "showAppsembleLogin"::BOOLEAN END;
  `);
  await queryInterface.changeColumn('User', 'timezone', {
    type: DataTypes.STRING,
    allowNull: false,
  });
  await queryInterface.changeColumn('User', 'subscribed', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  });
  await queryInterface.changeColumn('AppOAuth2Authorization', 'AppMemberId', {
    type: DataTypes.UUID,
    allowNull: false,
  });
  await queryInterface.changeColumn('AppSamlSecret', 'name', {
    type: DataTypes.STRING,
    allowNull: false,
  });
  await queryInterface.changeColumn('AppSamlAuthorization', 'AppMemberId', {
    type: DataTypes.UUID,
    allowNull: false,
  });
  await queryInterface.sequelize.query(`
    ALTER TABLE "AppScreenshot" DROP COLUMN IF EXISTS "name";
  `);
  await queryInterface.changeColumn('BlockVersion', 'examples', {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
  });
  await queryInterface.sequelize.query(`
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_Member_role') THEN
        ALTER TYPE "enum_Member_role" RENAME TO "enum_OrganizationMember_role";
      END IF;
    END $$;
  `);
  await queryInterface.sequelize.query(`
    ALTER TYPE "enum_OrganizationMember_role" ADD VALUE 'AccountManager' AFTER 'Owner';
  `);
  await queryInterface.sequelize.query(`
    ALTER TYPE "enum_OrganizationInvite_role" ADD VALUE 'Translator' AFTER 'Member';
    ALTER TYPE "enum_OrganizationInvite_role" ADD VALUE 'APIReader' AFTER 'Translator';
    ALTER TYPE "enum_OrganizationInvite_role" ADD VALUE 'APIUser' AFTER 'APIReader';
    ALTER TYPE "enum_OrganizationInvite_role" ADD VALUE 'AccountManager' AFTER 'Maintainer';
  `);
  await queryInterface.changeColumn('SamlLoginRequest', 'timezone', {
    type: DataTypes.STRING,
    allowNull: false,
  });
  await queryInterface.changeColumn('TeamInvite', 'role', {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'member',
  });
  await queryInterface.sequelize.query(`
    ALTER TABLE "TeamMember" ALTER COLUMN "role" SET DEFAULT 'member';
  `);
  await queryInterface.sequelize.query(`
    ALTER TABLE "TeamMember" ADD PRIMARY KEY ("TeamId", "AppMemberId");
  `);
  await queryInterface.changeColumn('AppMember', 'scimActive', {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: null,
  });
  await queryInterface.changeColumn('ResourceVersion', 'AppMemberId', {
    type: DataTypes.UUID,
    allowNull: true,
  });
  await queryInterface.changeColumn('Training', 'competences', {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: false,
  });
  await queryInterface.changeColumn('Training', 'difficultyLevel', {
    type: DataTypes.INTEGER,
    allowNull: false,
  });
  await queryInterface.changeColumn('EmailAuthorization', 'UserId', {
    type: DataTypes.UUID,
    allowNull: true,
  });
  await queryInterface.changeColumn('AppMember', 'UserId', {
    type: DataTypes.UUID,
    allowNull: true,
  });
}

/**
 * Summary:
 *
 * @param db The sequelize database.
 */
export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  await queryInterface.changeColumn('AppServiceSecret', 'AppId', {
    allowNull: true,
    type: DataTypes.INTEGER,
  });
  await queryInterface.changeColumn('App', 'showAppDefinition', {
    allowNull: true,
    defaultValue: true,
    type: DataTypes.BOOLEAN,
  });
  await queryInterface.sequelize.query(`
    ALTER TABLE "App" ALTER COLUMN "showAppsembleLogin" TYPE VARCHAR(255) USING CASE "showAppsembleLogin" WHEN true THEN 'true' WHEN false THEN 'false' ELSE "showAppsembleLogin"::VARCHAR END;
  `);
  await queryInterface.changeColumn('User', 'timezone', {
    type: DataTypes.STRING,
    allowNull: true,
  });
  await queryInterface.changeColumn('User', 'subscribed', {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  });
  await queryInterface.changeColumn('AppOAuth2Authorization', 'AppMemberId', {
    type: DataTypes.UUID,
    allowNull: true,
  });
  await queryInterface.changeColumn('AppSamlSecret', 'name', {
    type: DataTypes.TEXT,
    allowNull: false,
  });
  await queryInterface.changeColumn('AppSamlAuthorization', 'AppMemberId', {
    type: DataTypes.UUID,
    allowNull: true,
  });
  await queryInterface.addColumn('AppScreenshot', 'name', {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
    comment: null,
    primaryKey: false,
  });
  await queryInterface.changeColumn('BlockVersion', 'examples', {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: null,
  });
  await queryInterface.sequelize.query(`
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_OrganizationMember_role') THEN
        ALTER TYPE "enum_OrganizationMember_role" RENAME TO "enum_Member_role";
      END IF;
    END $$;
  `);
  await queryInterface.sequelize.query(`
    DELETE FROM pg_enum WHERE enumlabel = 'AccountManager' AND enumtypid = (
      SELECT oid FROM pg_type WHERE typname = 'enum_Member_role'
    );
  `);
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
  await queryInterface.changeColumn('AppMember', 'scimActive', {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: true,
  });
  await queryInterface.changeColumn('ResourceVersion', 'AppMemberId', {
    type: DataTypes.UUID,
    allowNull: false,
  });
  await queryInterface.changeColumn('Training', 'competences', {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true,
  });
  await queryInterface.changeColumn('Training', 'difficultyLevel', {
    type: DataTypes.INTEGER,
    allowNull: true,
  });
  await queryInterface.changeColumn('EmailAuthorization', 'UserId', {
    type: DataTypes.UUID,
    allowNull: false,
  });
}
