import { DataTypes } from 'sequelize';

export default {
  key: '0.6.0',
  async up(db) {
    const queryInterface = db.getQueryInterface();

    await queryInterface.createTable('Organization', {
      id: { type: DataTypes.STRING, primaryKey: true },
      OrganizationId: {
        type: DataTypes.STRING,
        references: {
          model: 'Organization',
          key: 'id',
        },
      },
      coreStyle: { type: DataTypes.TEXT('long') },
      sharedStyle: { type: DataTypes.TEXT('long') },
      created: { allowNull: false, type: DataTypes.DATE },
      updated: { allowNull: false, type: DataTypes.DATE },
      deleted: { allowNull: true, type: DataTypes.DATE },
    });

    await queryInterface.createTable('User', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      created: { allowNull: false, type: DataTypes.DATE },
      updated: { allowNull: false, type: DataTypes.DATE },
      deleted: { allowNull: true, type: DataTypes.DATE },
    });

    await queryInterface.createTable('App', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      definition: { type: DataTypes.JSON, allowNull: false },
      description: { type: DataTypes.STRING(80), allowNull: true },
      icon: { type: DataTypes.BLOB('long') },
      path: { type: DataTypes.STRING, unique: true, allowNull: false },
      style: { type: DataTypes.TEXT('long') },
      sharedStyle: { type: DataTypes.TEXT('long') },
      yaml: { type: DataTypes.TEXT('long') },
      created: { allowNull: false, type: DataTypes.DATE },
      updated: { allowNull: false, type: DataTypes.DATE },
      deleted: { allowNull: true, type: DataTypes.DATE },
      OrganizationId: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
          model: 'Organization',
          key: 'id',
        },
      },
    });

    await queryInterface.createTable('BlockDefinition', {
      id: { type: DataTypes.STRING, primaryKey: true },
      description: DataTypes.STRING,
    });

    await queryInterface.createTable('AppBlockStyle', {
      style: { type: DataTypes.TEXT('long') },
      AppId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'App',
          key: 'id',
        },
      },
      BlockDefinitionId: {
        type: DataTypes.STRING,
        references: {
          model: 'BlockDefinition',
          key: 'id',
        },
      },
      created: { allowNull: false, type: DataTypes.DATE },
      updated: { allowNull: false, type: DataTypes.DATE },
      deleted: { allowNull: true, type: DataTypes.DATE },
    });

    await queryInterface.createTable('Asset', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      mime: { type: DataTypes.STRING, allowNull: true },
      filename: { type: DataTypes.STRING, allowNull: true },
      data: { type: DataTypes.BLOB('long'), allowNull: false },
      created: { allowNull: false, type: DataTypes.DATE },
      updated: { allowNull: false, type: DataTypes.DATE },
      deleted: { allowNull: true, type: DataTypes.DATE },
    });

    await queryInterface.createTable('BlockVersion', {
      name: {
        type: DataTypes.STRING,
        unique: 'blockVersionComposite',
        references: { model: 'BlockDefinition', key: 'id' },
      },
      version: { type: DataTypes.STRING, primaryKey: true, unique: 'blockVersionComposite' },
      layout: { type: DataTypes.STRING },
      actions: { type: DataTypes.JSON },
      resources: { type: DataTypes.JSON },
      created: { allowNull: false, type: DataTypes.DATE },
      updated: { allowNull: false, type: DataTypes.DATE },
      deleted: { allowNull: true, type: DataTypes.DATE },
    });

    await queryInterface.createTable('BlockAsset', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: {
        type: DataTypes.STRING,
        references: {
          model: 'BlockVersion',
          key: 'name',
        },
      },
      version: {
        type: DataTypes.STRING,
        references: {
          model: 'BlockVersion',
          key: 'version',
        },
      },
      filename: { type: DataTypes.STRING },
      mime: { type: DataTypes.STRING },
      content: { type: DataTypes.BLOB('long') },
      created: { allowNull: false, type: DataTypes.DATE },
      updated: { allowNull: false, type: DataTypes.DATE },
      deleted: { allowNull: true, type: DataTypes.DATE },
    });

    await queryInterface.createTable('EmailAuthorization', {
      email: { type: DataTypes.STRING, primaryKey: true },
      UserId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'User',
          key: 'id',
        },
      },
      name: DataTypes.STRING,
      password: { type: DataTypes.STRING, allowNull: false },
      verified: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
      key: DataTypes.STRING,
      created: { allowNull: false, type: DataTypes.DATE },
      updated: { allowNull: false, type: DataTypes.DATE },
      deleted: { allowNull: true, type: DataTypes.DATE },
    });

    await queryInterface.createTable('OAuthAuthorization', {
      id: { type: DataTypes.STRING, primaryKey: true },
      UserId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'User',
          key: 'id',
        },
      },
      provider: { type: DataTypes.STRING, primaryKey: true },
      token: { type: DataTypes.TEXT, allowNull: false },
      expiresAt: { type: DataTypes.DATE, allowNull: true },
      refreshToken: { type: DataTypes.TEXT, allowNull: true },
      verified: { type: DataTypes.BOOLEAN, default: false },
      created: { allowNull: false, type: DataTypes.DATE },
      updated: { allowNull: false, type: DataTypes.DATE },
    });

    await queryInterface.createTable('OAuthClient', {
      clientId: { type: DataTypes.STRING, primaryKey: true },
      clientSecret: { type: DataTypes.STRING, primaryKey: true },
      redirectUri: { type: DataTypes.STRING, allowNull: false },
      created: { allowNull: false, type: DataTypes.DATE },
      updated: { allowNull: false, type: DataTypes.DATE },
      deleted: { allowNull: true, type: DataTypes.DATE },
    });

    await queryInterface.createTable('OAuthToken', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      UserId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'User',
          key: 'id',
        },
      },
      token: { type: DataTypes.TEXT, allowNull: false },
      refreshToken: { type: DataTypes.TEXT, allowNull: false },
      created: { allowNull: false, type: DataTypes.DATE },
      updated: { allowNull: false, type: DataTypes.DATE },
    });

    await queryInterface.createTable('OrganizationBlockStyle', {
      OrganizationId: {
        type: DataTypes.STRING,
        references: {
          model: 'Organization',
          key: 'id',
        },
      },
      BlockDefinitionId: {
        type: DataTypes.STRING,
        references: {
          model: 'BlockDefinition',
          key: 'id',
        },
      },
      style: { type: DataTypes.TEXT('long') },
      created: { allowNull: false, type: DataTypes.DATE },
      updated: { allowNull: false, type: DataTypes.DATE },
      deleted: { allowNull: true, type: DataTypes.DATE },
    });

    await queryInterface.createTable('ResetPasswordToken', {
      EmailAuthorizationEmail: {
        type: DataTypes.STRING,
        allowNull: false,
        onDelete: 'CASCADE',
        references: {
          model: 'EmailAuthorization',
          key: 'email',
        },
      },
      token: { type: DataTypes.STRING, primaryKey: true },
      created: { allowNull: false, type: DataTypes.DATE },
      updated: { allowNull: false, type: DataTypes.DATE },
    });

    await queryInterface.createTable('Resource', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      AppId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'App',
          key: 'id',
        },
      },
      UserId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'User',
          key: 'id',
        },
      },
      type: DataTypes.STRING,
      data: DataTypes.JSON,
      created: { allowNull: false, type: DataTypes.DATE },
      updated: { allowNull: false, type: DataTypes.DATE },
      deleted: { allowNull: true, type: DataTypes.DATE },
    });

    await queryInterface.createTable('UserOrganization', {
      UserId: { type: DataTypes.INTEGER, references: { model: 'User', key: 'id' } },
      OrganizationId: {
        type: DataTypes.STRING,
        references: { model: 'Organization', key: 'id' },
      },
      created: { allowNull: false, type: DataTypes.DATE },
      updated: { allowNull: false, type: DataTypes.DATE },
    });
  },
  async down(db) {
    const queryInterface = db.getQueryInterface();

    await queryInterface.dropTable('ResetPasswordToken');
    await queryInterface.dropTable('EmailAuthorization');
    await queryInterface.dropTable('OAuthAuthorization');
    await queryInterface.dropTable('OAuthToken');
    await queryInterface.dropTable('Resource');
    await queryInterface.dropTable('UserOrganization');
    await queryInterface.dropTable('User');
    await queryInterface.dropTable('OrganizationBlockStyle');
    await queryInterface.dropTable('AppBlockStyle');
    await queryInterface.dropTable('App');
    await queryInterface.dropTable('Organization');
    await queryInterface.dropTable('OAuthClient');
    await queryInterface.dropTable('BlockVersion');
    await queryInterface.dropTable('BlockDefinition');
    await queryInterface.dropTable('BlockAsset');
    await queryInterface.dropTable('Asset');
  },
};
