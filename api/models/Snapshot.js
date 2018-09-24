const Snapshot = (sequelize, DataTypes) => sequelize.define('Snapshot', {
  version: { type: DataTypes.STRING, primaryKey: true },
  definition: { type: DataTypes.JSON, allowNull: false },
}, {
  freezeTableName: true,
  paranoid: true,
  createdAt: 'created',
  updatedAt: 'updated',
  deletedAt: 'deleted',
});

export default Snapshot;
