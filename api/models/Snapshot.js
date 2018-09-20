const Snapshot = (sequelize, DataTypes) => sequelize.define('Snapshot', {
  version: { type: DataTypes.STRING, primaryKey: true },
  definition: { type: DataTypes.JSON, allowNull: false },
}, {
  freezeTableName: true,
  paranoid: true,
});

export default Snapshot;
