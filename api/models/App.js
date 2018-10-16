export default (sequelize, DataTypes) =>
  sequelize.define(
    'App',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      definition: { type: DataTypes.JSON, allowNull: false },
      icon: { type: DataTypes.BLOB('long') },
      url: { type: DataTypes.STRING, unique: true, allowNull: false },
    },
    {
      freezeTableName: true,
      paranoid: true,
      createdAt: 'created',
      updatedAt: 'updated',
      deletedAt: 'deleted',
    },
  );
