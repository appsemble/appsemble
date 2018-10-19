export default (sequelize, DataTypes) =>
  sequelize.define(
    'OAuthAuthorization',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      token: { type: DataTypes.TEXT, allowNull: false },
      refreshToken: { type: DataTypes.TEXT, allowNull: false },
    },
    {
      freezeTableName: true,
      createdAt: 'created',
      updatedAt: 'updated',
    },
  );
