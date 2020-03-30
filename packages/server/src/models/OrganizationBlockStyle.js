import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const OrganizationBlockStyle = sequelize.define(
    'OrganizationBlockStyle',
    {
      OrganizationId: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
        references: { model: 'Organization' },
      },
      /**
       * This refers to the organization and name of a block
       * it is agnostic of the version of the block.
       *
       * Format: @organizationName/blockName
       */
      block: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
      },
      style: { type: DataTypes.TEXT },
    },
    {
      freezeTableName: true,
      paranoid: true,
      createdAt: 'created',
      updatedAt: 'updated',
      deletedAt: 'deleted',
    },
  );

  OrganizationBlockStyle.associate = ({ Organization }) => {
    OrganizationBlockStyle.belongsTo(Organization, { foreignKey: 'OrganizationId' });
  };

  return OrganizationBlockStyle;
};
