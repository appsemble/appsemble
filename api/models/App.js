const App = (sequelize, DataTypes) => sequelize.define('App', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  definition: { type: DataTypes.JSON, allowNull: false },
}, {
  freezeTableName: true,
  paranoid: true,
});

export default App;
