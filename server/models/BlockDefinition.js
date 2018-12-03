export default (sequelize, DataTypes) =>
  sequelize.define(
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
