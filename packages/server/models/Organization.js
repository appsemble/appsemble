import { DataTypes } from 'sequelize';

export default sequelize => {
  const Organization = sequelize.define(
    'Organization',
    {
      id: { type: DataTypes.STRING, primaryKey: true },
      coreStyle: { type: DataTypes.TEXT('long') },
      sharedStyle: { type: DataTypes.TEXT('long') },
    },
    {
      freezeTableName: true,
      paranoid: true,
      createdAt: 'created',
      updatedAt: 'updated',
      deletedAt: 'deleted',
    },
  );

  Organization.associate = ({ App, User, OrganizationBlockStyle }) => {
    Organization.hasOne(Organization);
    Organization.hasMany(App);
    Organization.belongsToMany(User, { through: 'UserOrganization' });
    Organization.hasMany(OrganizationBlockStyle);
  };

  return Organization;
};
