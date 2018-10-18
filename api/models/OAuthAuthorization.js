export default (sequelize, DataTypes) =>
  sequelize.define(
    'OAuthAuthorization',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      token: { type: DataTypes.TEXT, allowNull: false },
      tokenExpires: { type: DataTypes.DATE, allowNull: false },
      clientId: { type: DataTypes.STRING, allowNull: false },
      refreshToken: { type: DataTypes.TEXT, allowNull: false },
      scope: { type: DataTypes.STRING(1024) },
    },
    {
      freezeTableName: true,
      paranoid: true,
      createdAt: 'created',
      updatedAt: 'updated',
      deletedAt: 'deleted',
    },
  );
