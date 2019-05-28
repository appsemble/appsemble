export default function(sequelize, DataTypes) {
  const User = sequelize.define(
    'User',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING },
      password: { type: DataTypes.STRING },
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
    User.hasMany(EmailAuthorization);
    User.hasOne(EmailAuthorization, {
      as: 'primaryEmail',
    });
  };

  return User;
}
