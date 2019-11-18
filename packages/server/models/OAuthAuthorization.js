import { DataTypes } from 'sequelize';

export default sequelize => {
  const OAuthAuthorization = sequelize.define(
    'OAuthAuthorization',
    {
      id: { type: DataTypes.STRING, primaryKey: true },
      state: { type: DataTypes.STRING },
      provider: { type: DataTypes.STRING, primaryKey: true },
      // scope: { type: DataTypes.STRING, primaryKey: true },
      accessToken: { type: DataTypes.TEXT, allowNull: false },
      expiresAt: { type: DataTypes.DATE, allowNull: true },
      refreshToken: { type: DataTypes.TEXT, allowNull: true },
      verified: { type: DataTypes.BOOLEAN, default: false },
    },
    {
      freezeTableName: true,
      createdAt: 'created',
      updatedAt: 'updated',
    },
  );

  OAuthAuthorization.associate = ({ User }) => {
    OAuthAuthorization.belongsTo(User);
  };

  return OAuthAuthorization;
};
