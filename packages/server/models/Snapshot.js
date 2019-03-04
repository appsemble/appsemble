export default (sequelize, DataTypes) =>
  sequelize.define(
    'Snapshot',
    {
      version: { type: DataTypes.STRING, primaryKey: true },
      definition: { type: DataTypes.JSON, allowNull: false },
    },
    {
      freezeTableName: true,
      paranoid: true,
      createdAt: 'created',
      updatedAt: 'updated',
      deletedAt: 'deleted',
    },
  );
