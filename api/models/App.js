const App = (sequelize, DataTypes) => sequelize.define('App', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  definition: { type: DataTypes.JSON, allowNull: false },
}, {
  freezeTableName: true,
  paranoid: true,
  createdAt: 'created',
  updatedAt: 'updated',
  deletedAt: 'deleted',
});

export default App;
