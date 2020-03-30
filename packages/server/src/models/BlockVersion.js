import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const BlockVersion = sequelize.define(
    'BlockVersion',
    {
      OrganizationId: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
        references: { model: 'Organization' },
      },
      name: { type: DataTypes.STRING, primaryKey: true, unique: 'blockVersionComposite' },
      version: { type: DataTypes.STRING, primaryKey: true, unique: 'blockVersionComposite' },
      description: { type: DataTypes.TEXT },
      layout: { type: DataTypes.STRING },
      actions: { type: DataTypes.JSON },
      parameters: { type: DataTypes.JSON },
      resources: { type: DataTypes.JSON },
      events: { type: DataTypes.JSON },
    },
    {
      freezeTableName: true,
      createdAt: 'created',
      updatedAt: 'updated',
    },
  );

  BlockVersion.associate = ({ BlockAsset, Organization }) => {
    BlockVersion.hasMany(BlockAsset, { foreignKey: 'name', sourceKey: 'name' });
    BlockVersion.hasMany(BlockAsset, { foreignKey: 'version', sourceKey: 'version' });
    BlockVersion.belongsTo(Organization, { foreignKey: { allowNull: false } });
  };

  return BlockVersion;
};
