import { DataTypes } from 'sequelize';

export default sequelize => {
  const OrganizationInvite = sequelize.define(
    'OrganizationInvite',
    {
      email: { type: DataTypes.STRING, allowNull: false },
      key: { type: DataTypes.STRING, allowNull: false },
    },
    {
      freezeTableName: true,
      createdAt: 'created',
      updatedAt: 'updated',
      indexes: [
        {
          name: 'EmailOrganizationIndex',
          fields: ['email', 'OrganizationId'],
        },
      ],
    },
  );

  OrganizationInvite.associate = ({ User, Organization }) => {
    OrganizationInvite.hasOne(Organization);
    OrganizationInvite.hasOne(User);
  };

  return OrganizationInvite;
};
