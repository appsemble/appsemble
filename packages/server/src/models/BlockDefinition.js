import { DataTypes } from 'sequelize';

export default sequelize => {
  const BlockDefinition = sequelize.define(
    'BlockDefinition',
    {
      id: { type: DataTypes.STRING, primaryKey: true },
      description: DataTypes.STRING,
    },
    {
      freezeTableName: true,
      paranoid: true,
      createdAt: 'created',
      updatedAt: 'updated',
      deletedAt: 'deleted',
    },
  );

  BlockDefinition.associate = ({ BlockVersion }) => {
    BlockDefinition.hasMany(BlockVersion, { foreignKey: 'name', sourceKey: 'id' });
  };

  return BlockDefinition;
};
