import { DataTypes } from 'sequelize';

export default sequelize => {
  const User = sequelize.define(
    'User',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    },
    {
      freezeTableName: true,
      paranoid: true,
      createdAt: 'created',
      updatedAt: 'updated',
      deletedAt: 'deleted',
    },
  );

  User.associate = ({ Organization, OAuthToken, OAuthAuthorization, EmailAuthorization }) => {
    User.belongsToMany(Organization, { through: 'UserOrganization' });
    User.hasMany(OAuthToken);
    User.hasMany(OAuthAuthorization);
    User.hasOne(EmailAuthorization);
  };

  return User;
};
