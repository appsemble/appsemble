import { DataTypes, QueryTypes, type Sequelize } from 'sequelize';

export const key = '0.10.0';

export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  await queryInterface.addColumn('Member', 'role', {
    type: DataTypes.ENUM('Member', 'Owner', 'Maintainer', 'AppEditor'),
    defaultValue: 'Member',
    allowNull: false,
  });
  await db.query('UPDATE "Member" SET "role" = ?', {
    replacements: ['Owner'],
    type: QueryTypes.UPDATE,
  });

  await queryInterface.addColumn('OAuthAuthorization', 'code', {
    type: DataTypes.TEXT,
    allowNull: true,
  });
  await queryInterface.removeColumn('OAuthAuthorization', 'verified');
  await queryInterface.createTable('OAuth2ClientCredentials', {
    id: { type: DataTypes.STRING, primaryKey: true },
    description: { type: DataTypes.STRING, allowNull: false },
    secret: { type: DataTypes.STRING, allowNull: false },
    expires: { type: DataTypes.DATE, allowNull: true },
    scopes: { type: DataTypes.STRING, allowNull: false },
    UserId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'User',
        key: 'id',
      },
    },
    created: { type: DataTypes.DATE, allowNull: false },
  });

  await queryInterface.dropTable('OAuthClient');
  await queryInterface.dropTable('OAuthToken');
}

export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  await queryInterface.removeColumn('Member', 'role');
  await db.query('DROP TYPE IF EXISTS "enum_Member_role"');

  await queryInterface.createTable('OAuth2ClientCredentials', {
    clientId: { type: DataTypes.STRING, primaryKey: true },
    clientSecret: { type: DataTypes.STRING, primaryKey: true },
    redirectUri: { type: DataTypes.STRING, allowNull: false },
    UserId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'User',
        key: 'id',
      },
    },
    created: { type: DataTypes.DATE, allowNull: false },
    updated: { type: DataTypes.DATE, allowNull: false },
    deleted: { type: DataTypes.DATE, allowNull: true },
  });
  await queryInterface.createTable('OAuthToken', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    token: { type: DataTypes.TEXT, allowNull: false },
    refreshToken: { type: DataTypes.TEXT, allowNull: false },
    UserId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'User',
        key: 'id',
      },
    },
    created: { type: DataTypes.DATE, allowNull: false },
    updated: { type: DataTypes.DATE, allowNull: false },
    deleted: { type: DataTypes.DATE, allowNull: true },
  });

  await queryInterface.addColumn('OAuthAuthorization', 'verified', {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  });
  await queryInterface.removeColumn('OAuthAuthorization', 'code');
  await queryInterface.dropTable('OAuth2ClientCredentials');
}
