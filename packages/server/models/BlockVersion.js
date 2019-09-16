import { DataTypes } from 'sequelize';

export default sequelize => {
  const BlockVersion = sequelize.define(
    'BlockVersion',
    {
      name: { type: DataTypes.STRING, primaryKey: true, unique: 'blockVersionComposite' },
      version: { type: DataTypes.STRING, primaryKey: true, unique: 'blockVersionComposite' },
      layout: { type: DataTypes.STRING },
      actions: { type: DataTypes.JSON },
      parameters: { type: DataTypes.JSON },
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
