import { DataTypes } from 'sequelize';

export default sequelize => {
  const OrganizationInvite = sequelize.define(
    'OrganizationInvite',
    {
      email: { type: DataTypes.STRING, allowNull: false },
      key: { type: DataTypes.STRING, allowNull: false },
      UserId: { type: DataTypes.INTEGER, unique: 'EmailOrganizationInex' },
      OrganizationId: { type: DataTypes.STRING, unique: 'EmailOrganizationInex' },
    },
    {
      freezeTableName: true,
      createdAt: 'created',
      updatedAt: 'updated',
    },
  );

  OrganizationInvite.associate = ({ User, Organization }) => {
    OrganizationInvite.hasOne(Organization);
    OrganizationInvite.hasOne(User);
  };

  return OrganizationInvite;
};
