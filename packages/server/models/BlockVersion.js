export default (sequelize, DataTypes) => {
  const BlockVersion = sequelize.define(
    'BlockVersion',
    {
      name: { type: DataTypes.STRING, primaryKey: true },
      version: { type: DataTypes.STRING, primaryKey: true },
      layout: { type: DataTypes.STRING },
      actions: { type: DataTypes.JSON },
      resources: { type: DataTypes.JSON },
    },
    {
      freezeTableName: true,
      paranoid: true,
      createdAt: 'created',
      updatedAt: 'updated',
      deletedAt: 'deleted',
    },
  );

  BlockVersion.associate = ({ BlockAsset }) => {
    BlockVersion.hasMany(BlockAsset, { foreignKey: 'name', sourceKey: 'name' });
    BlockVersion.hasMany(BlockAsset, { foreignKey: 'version', sourceKey: 'version' });
  };

  return BlockVersion;
};
