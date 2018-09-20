const BlockVersion = (sequelize, DataTypes) => sequelize.define('BlockVersion', {
  name: { type: DataTypes.STRING, primaryKey: true },
}, {
  freezeTableName: true,
  paranoid: true,
});

export default BlockVersion;
