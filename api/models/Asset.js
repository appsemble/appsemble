export default (sequelize, DataTypes) =>
  sequelize.define(
    'Asset',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      mime: { type: DataTypes.STRING, allowNull: true },
      filename: { type: DataTypes.STRING, allowNull: true },
      data: { type: DataTypes.BLOB('long'), allowNull: false },
    },
    {
      freezeTableName: true,
      paranoid: true,
      createdAt: 'created',
      updatedAt: 'updated',
      deletedAt: 'deleted',
    },
  );
