import { DataTypes } from 'sequelize';

export default sequelize => {
  const OAuth2ClientCredentials = sequelize.define(
    'OAuth2ClientCredentials',
    {
      id: { type: DataTypes.STRING, primaryKey: true },
      description: { type: DataTypes.STRING, allowNull: false },
      secret: { type: DataTypes.STRING, allowNull: false },
      expires: { type: DataTypes.DATE },
      scopes: { type: DataTypes.STRING, allowNull: false },
    },
    {
      freezeTableName: true,
      paranoid: false,
      createdAt: 'created',
      updatedAt: false,
    },
  );

  OAuth2ClientCredentials.associate = ({ User }) => {
    OAuth2ClientCredentials.belongsTo(User, {
      foreignKey: { allowNull: false },
      onDelete: 'CASCADE',
    });
  };

  return OAuth2ClientCredentials;
};
