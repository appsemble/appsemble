export default (sequelize, DataTypes) =>
  sequelize.define(
    'BlockVersion',
    {
      name: { type: DataTypes.STRING, primaryKey: true },
      version: { type: DataTypes.STRING, primaryKey: true },
      position: { type: DataTypes.STRING },
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
