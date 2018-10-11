export default (sequelize, DataTypes) =>
  sequelize.define(
    'OAuthAuthorization',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      token: { type: DataTypes.STRING },
      tokenExpires: { type: DataTypes.DATE, allowNull: false },
      clientId: { type: DataTypes.STRING, allowNull: false },
      refreshToken: { type: DataTypes.STRING, allowNull: false },
      refreshTokenExpires: { type: DataTypes.DATE, allowNull: false },
      provider: { type: DataTypes.STRING, allowNull: false },
    },
    {
      freezeTableName: true,
      paranoid: true,
      createdAt: 'created',
      updatedAt: 'updated',
      deletedAt: 'deleted',
    },
  );
