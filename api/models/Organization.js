const Organization = (sequelize, DataTypes) => sequelize.define('Organization', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: DataTypes.STRING,
}, {
  freezeTableName: true,
  paranoid: true,
});

export default Organization;
