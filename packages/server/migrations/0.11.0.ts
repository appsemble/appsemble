import { DataTypes, type Sequelize } from 'sequelize';

export const key = '0.11.0';

export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  await queryInterface.createTable('AppMember', {
    role: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    AppId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'App',
        key: 'id',
      },
    },
    UserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'User',
        key: 'id',
      },
    },
    created: { allowNull: false, type: DataTypes.DATE },
    updated: { allowNull: false, type: DataTypes.DATE },
  });

  await queryInterface.createTable('ResourceSubscription', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    type: { type: DataTypes.STRING },
    action: { type: DataTypes.STRING },
    ResourceId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Resource',
        key: 'id',
      },
    },
    AppSubscriptionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'AppSubscription',
        key: 'id',
      },
    },
    created: { allowNull: false, type: DataTypes.DATE },
    updated: { allowNull: false, type: DataTypes.DATE },
  });

  await queryInterface.addColumn('Asset', 'AppId', {
    type: DataTypes.INTEGER,
    // Null is allowed to allow for smoother manual associations
    allowNull: true,
    references: {
      model: 'App',
      key: 'id',
    },
  });

  await queryInterface.addColumn('Asset', 'UserId', {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'User',
      key: 'id',
    },
  });

  await queryInterface.addColumn('BlockVersion', 'events', {
    type: DataTypes.JSON,
  });

  await queryInterface.createTable('OAuth2AuthorizationCode', {
    code: { type: DataTypes.STRING, allowNull: false, primaryKey: true },
    redirectUri: { type: DataTypes.STRING, allowNull: false },
    expires: { type: DataTypes.DATE, allowNull: false },
    UserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'User',
        key: 'id',
      },
    },
    AppId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'App',
        key: 'id',
      },
    },
  });
}

export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  await queryInterface.dropTable('AppMember');
  await queryInterface.dropTable('ResourceSubscription');
  await queryInterface.removeColumn('Asset', 'AppId');
  await queryInterface.removeColumn('Asset', 'UserId');
  await queryInterface.removeColumn('BlockVersion', 'events');
  await queryInterface.dropTable('OAuth2AuthorizationCode');
}
