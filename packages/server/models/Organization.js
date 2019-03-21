export default (sequelize, DataTypes) =>
  sequelize.define(
    'Organization',
    {
      id: { type: DataTypes.STRING, primaryKey: true },
      coreStyle: { type: DataTypes.TEXT('long') },
      sharedStyle: { type: DataTypes.TEXT('long') },
    },
    {
      freezeTableName: true,
      paranoid: true,
      createdAt: 'created',
      updatedAt: 'updated',
      deletedAt: 'deleted',
    },
  );
