import { DataTypes } from 'sequelize';

export default sequelize => {
  const OAuthToken = sequelize.define(
    'OAuthToken',
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

  OAuthToken.associate = () => {};

  return OAuthToken;
};
