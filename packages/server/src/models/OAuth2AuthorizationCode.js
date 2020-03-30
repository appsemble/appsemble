import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const OAuth2AuthorizationCode = sequelize.define(
    'OAuth2AuthorizationCode',
    {
      code: { type: DataTypes.STRING, allowNull: false, primaryKey: true },
      redirectUri: { type: DataTypes.STRING, allowNull: false },
      expires: { type: DataTypes.DATE, allowNull: false },
    },
    {
      freezeTableName: true,
      paranoid: false,
      createdAt: false,
      updatedAt: false,
    },
  );

  OAuth2AuthorizationCode.associate = ({ App, User }) => {
    OAuth2AuthorizationCode.belongsTo(User, {
      foreignKey: { allowNull: false },
      onDelete: 'CASCADE',
    });
    OAuth2AuthorizationCode.belongsTo(App, {
      foreignKey: { allowNull: false, primaryKey: true },
      onDelete: 'CASCADE',
    });
    App.hasMany(OAuth2AuthorizationCode);
  };

  return OAuth2AuthorizationCode;
};
