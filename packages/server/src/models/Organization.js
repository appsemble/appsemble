import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Organization = sequelize.define(
    'Organization',
    {
      id: { type: DataTypes.STRING, primaryKey: true },
      name: { type: DataTypes.STRING },
      coreStyle: { type: DataTypes.TEXT },
      sharedStyle: { type: DataTypes.TEXT },
    },
    {
      freezeTableName: true,
      paranoid: true,
      createdAt: 'created',
      updatedAt: 'updated',
      deletedAt: 'deleted',
    },
  );

  Organization.associate = ({ App, Member, OrganizationBlockStyle, OrganizationInvite, User }) => {
    Organization.hasMany(OrganizationInvite);
    Organization.hasOne(Organization);
    Organization.hasMany(App);
    Organization.belongsToMany(User, { through: Member });
    Organization.hasMany(OrganizationBlockStyle);
  };

  return Organization;
};
