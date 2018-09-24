const Resource = (sequelize, DataTypes) => sequelize.define('Resource', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  type: DataTypes.STRING,
}, {
  freezeTableName: true,
  paranoid: true,
  createdAt: 'created',
  updatedAt: 'updated',
  deletedAt: 'deleted',
});

export default Resource;
