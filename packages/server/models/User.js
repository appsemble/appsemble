import { DataTypes } from 'sequelize';

export default sequelize => {
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

  User.associate = ({
    Organization,
    OAuthToken,
    OAuthAuthorization,
    EmailAuthorization,
    ResetPasswordToken,
    Member,
  }) => {
    User.belongsToMany(Organization, { through: Member });
    User.hasMany(OAuthToken);
    User.hasMany(OAuthAuthorization);
    User.hasMany(EmailAuthorization);
    User.hasMany(ResetPasswordToken, {
      foreignKey: { allowNull: false },
      onDelete: 'CASCADE',
    });
    User.belongsTo(EmailAuthorization, {
      foreignKey: 'primaryEmail',
      constraints: false,
    });
  };

  return User;
};
