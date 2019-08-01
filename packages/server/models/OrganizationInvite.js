import { DataTypes } from 'sequelize';

export default sequelize => {
  const OrganizationInvite = sequelize.define(
    'OrganizationInvite',
    {
      email: { type: DataTypes.STRING, allowNull: false },
      key: { type: DataTypes.STRING, allowNull: false },
      UserId: { type: DataTypes.INTEGER, unique: 'EmailOrganizationIndex' },
      OrganizationId: { type: DataTypes.STRING, unique: 'EmailOrganizationIndex' },
    },
    {
      freezeTableName: true,
      createdAt: 'created',
      updatedAt: 'updated',
    },
  );

  OrganizationInvite.associate = ({ User, Organization }) => {
    OrganizationInvite.belongsTo(Organization);
    OrganizationInvite.belongsTo(User);
  };

  return OrganizationInvite;
};
