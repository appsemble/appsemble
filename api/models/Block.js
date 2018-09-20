const Block = (sequelize, DataTypes) => sequelize.define('Block', {
  name: { type: DataTypes.STRING, primaryKey: true },
  description: DataTypes.STRING,
}, {
  freezeTableName: true,
  paranoid: true,
});

export default Block;
