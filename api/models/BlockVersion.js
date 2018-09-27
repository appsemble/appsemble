export default (sequelize, DataTypes) => sequelize.define('BlockVersion', {
  name: { type: DataTypes.STRING, primaryKey: true },
}, {
  freezeTableName: true,
  paranoid: true,
  createdAt: 'created',
  updatedAt: 'updated',
  deletedAt: 'deleted',
});
