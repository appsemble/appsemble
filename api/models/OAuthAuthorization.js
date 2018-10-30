export default (sequelize, DataTypes) =>
  sequelize.define(
    'OAuthAuthorization',
    {
      id: { type: DataTypes.STRING, primaryKey: true },
      provider: { type: DataTypes.STRING, primaryKey: true },
      token: { type: DataTypes.TEXT, allowNull: false },
      expiresAt: { type: DataTypes.DATE, allowNull: true },
      refreshToken: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      freezeTableName: true,
      createdAt: 'created',
      updatedAt: 'updated',
    },
  );
